import { NextRequest } from "next/server"
import { prisma } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"
import { z } from "zod"
import { successResponse, errorResponse, handleError } from "@/lib/utils/api"
import { UserRole, RegistrationStatus, EventStatus } from "@prisma/client"

const batchRegistrationSchema = z.object({
  action: z.enum(["register", "cancel", "checkin", "promote"]),
  registrationIds: z.array(z.string()).min(1, "At least one registration ID required").max(100, "Maximum 100 registrations per batch"),
  eventId: z.string().optional(),
  reason: z.string().max(500, "Reason too long").optional(),
})

const batchEventSchema = z.object({
  action: z.enum(["publish", "cancel", "archive"]),
  eventIds: z.array(z.string()).min(1, "At least one event ID required").max(50, "Maximum 50 events per batch"),
  reason: z.string().max(500, "Reason too long").optional(),
})

const batchUserSchema = z.object({
  action: z.enum(["promote", "demote", "activate", "deactivate"]),
  userIds: z.array(z.string()).min(1, "At least one user ID required").max(50, "Maximum 50 users per batch"),
  newRole: z.nativeEnum(UserRole).optional(),
  reason: z.string().max(500, "Reason too long").optional(),
})


// POST /api/admin/batch - Perform batch operations (admin only)
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    
    if (!currentUser) {
      return errorResponse("Authentication required", 401, "UNAUTHORIZED")
    }

    const userRole = currentUser.role as UserRole
    const userId = currentUser.id

    // Only admins can perform batch operations
    if (userRole !== UserRole.ADMIN) {
      return errorResponse("Admin access required for batch operations", 403, "FORBIDDEN")
    }

    const body = await request.json()
    const { type } = body

    if (type === "registrations") {
      return await handleBatchRegistrations(body, userId)
    } else if (type === "events") {
      return await handleBatchEvents(body, userId)
    } else if (type === "users") {
      return await handleBatchUsers(body, userId)
    } else {
      return errorResponse("Invalid batch type. Use 'registrations', 'events', or 'users'", 400, "INVALID_TYPE")
    }

  } catch (error) {
    return handleError(error)
  }
}

// Handle batch registration operations
async function handleBatchRegistrations(body: unknown, adminId: string) {
  const { action, registrationIds, reason } = batchRegistrationSchema.parse(body)

  // Get all registrations
  const registrations = await prisma.registration.findMany({
    where: { id: { in: registrationIds } },
    select: {
      id: true,
      status: true,
      attendeeId: true,
      eventId: true,
      waitlistPosition: true,
      attendee: { select: { name: true } },
      event: { 
        select: { 
          title: true,
          capacity: true,
          eventDate: true,
          _count: {
            select: {
              registrations: {
                where: { status: { in: ['REGISTERED', 'ATTENDED'] } }
              }
            }
          }
        } 
      }
    }
  })

  if (registrations.length !== registrationIds.length) {
    return errorResponse("Some registrations not found", 400, "REGISTRATIONS_NOT_FOUND")
  }

  let results: unknown[] = []

  switch (action) {
    case "cancel":
      results = await prisma.$transaction(
        registrations.map(reg => {
          if (reg.status === RegistrationStatus.ATTENDED) {
            throw new Error(`Cannot cancel registration for ${reg.attendee.name} - already attended`)
          }
          
          return prisma.registration.update({
            where: { id: reg.id },
            data: { status: RegistrationStatus.CANCELLED }
          })
        })
      )
      break

    case "checkin":
      results = await prisma.$transaction(
        registrations.map(reg => {
          if (reg.status !== RegistrationStatus.REGISTERED) {
            throw new Error(`Cannot check in ${reg.attendee.name} - status is ${reg.status}`)
          }
          
          return prisma.registration.update({
            where: { id: reg.id },
            data: { 
              status: RegistrationStatus.ATTENDED,
              checkInTime: new Date()
            }
          })
        })
      )
      break

    case "promote":
      // Promote waitlisted users to registered
      const waitlistedOnly = registrations.filter(r => r.status === RegistrationStatus.WAITLISTED)
      
      results = await prisma.$transaction(
        waitlistedOnly.map(reg => {
          // Check if event has capacity
          if (reg.event.capacity && reg.event._count.registrations >= reg.event.capacity) {
            throw new Error(`Cannot promote ${reg.attendee.name} - event ${reg.event.title} is at capacity`)
          }
          
          return prisma.registration.update({
            where: { id: reg.id },
            data: { 
              status: RegistrationStatus.REGISTERED,
              waitlistPosition: null
            }
          })
        })
      )
      break

    default:
      return errorResponse("Invalid action for registrations", 400, "INVALID_ACTION")
  }

  // Log batch operation
  console.log(`Admin batch operation: ${action} on ${results.length} registrations by user ${adminId}. Reason: ${reason || 'None provided'}`)

  return successResponse({
    action,
    processed: results.length,
    results: results.map(r => ({ id: (r as { id: string }).id, status: (r as { status: string }).status })),
    reason
  }, `Batch ${action} completed successfully`)
}

// Handle batch event operations
async function handleBatchEvents(body: unknown, adminId: string) {
  const { action, eventIds, reason } = batchEventSchema.parse(body)

  // Get all events
  const events = await prisma.event.findMany({
    where: { id: { in: eventIds } },
    select: {
      id: true,
      title: true,
      status: true,
      eventDate: true,
      _count: {
        select: {
          registrations: true
        }
      }
    }
  })

  if (events.length !== eventIds.length) {
    return errorResponse("Some events not found", 400, "EVENTS_NOT_FOUND")
  }

  let results: unknown[] = []

  switch (action) {
    case "publish":
      results = await prisma.$transaction(
        events.map(event => {
          if (event.status === EventStatus.PUBLISHED) {
            throw new Error(`Event ${event.title} is already published`)
          }
          
          return prisma.event.update({
            where: { id: event.id },
            data: { status: EventStatus.PUBLISHED }
          })
        })
      )
      break

    case "cancel":
      results = await prisma.$transaction(
        events.map(event => {
          if (event.status === EventStatus.CANCELLED) {
            throw new Error(`Event ${event.title} is already cancelled`)
          }
          
          return prisma.event.update({
            where: { id: event.id },
            data: { status: EventStatus.CANCELLED }
          })
        })
      )
      break

    case "archive":
      // Only archive past events
      const pastEvents = events.filter(e => new Date() > new Date(e.eventDate))
      
      if (pastEvents.length === 0) {
        return errorResponse("No past events found to archive", 400, "NO_PAST_EVENTS")
      }

      results = await prisma.$transaction(
        pastEvents.map(event => 
          prisma.event.update({
            where: { id: event.id },
            data: { status: EventStatus.COMPLETED }
          })
        )
      )
      break

    default:
      return errorResponse("Invalid action for events", 400, "INVALID_ACTION")
  }

  // Log batch operation
  console.log(`Admin batch operation: ${action} on ${results.length} events by user ${adminId}. Reason: ${reason || 'None provided'}`)

  return successResponse({
    action,
    processed: results.length,
    results: results.map(r => ({ id: (r as { id: string }).id, status: (r as { status: string }).status })),
    reason
  }, `Batch ${action} completed successfully`)
}

// Handle batch user operations
async function handleBatchUsers(body: unknown, adminId: string) {
  const { action, userIds, newRole, reason } = batchUserSchema.parse(body)

  // Get all users
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: {
      id: true,
      name: true,
      email: true,
      role: true
    }
  })

  if (users.length !== userIds.length) {
    return errorResponse("Some users not found", 400, "USERS_NOT_FOUND")
  }

  // Prevent admin from demoting themselves
  const currentAdminInList = users.find(u => u.id === adminId)
  if (currentAdminInList && (action === "demote" || (action === "promote" && newRole !== UserRole.ADMIN))) {
    return errorResponse("Cannot change your own admin role", 400, "CANNOT_MODIFY_SELF")
  }

  let results: unknown[] = []

  switch (action) {
    case "promote":
      if (!newRole) {
        return errorResponse("newRole is required for promote action", 400, "MISSING_ROLE")
      }
      
      results = await prisma.$transaction(
        users.map(user => {
          if (user.role === newRole) {
            throw new Error(`User ${user.name} already has role ${newRole}`)
          }
          
          return prisma.user.update({
            where: { id: user.id },
            data: { role: newRole }
          })
        })
      )
      break

    case "demote":
      results = await prisma.$transaction(
        users.map(user => {
          if (user.role === UserRole.ATTENDEE) {
            throw new Error(`User ${user.name} is already an attendee`)
          }
          
          return prisma.user.update({
            where: { id: user.id },
            data: { role: UserRole.ATTENDEE }
          })
        })
      )
      break

    default:
      return errorResponse("Invalid action for users", 400, "INVALID_ACTION")
  }

  // Log batch operation
  console.log(`Admin batch operation: ${action} on ${results.length} users by user ${adminId}. Reason: ${reason || 'None provided'}`)

  return successResponse({
    action,
    processed: results.length,
    results: results.map(r => ({ id: (r as { id: string }).id, role: (r as { role: UserRole }).role })),
    reason
  }, `Batch ${action} completed successfully`)
}