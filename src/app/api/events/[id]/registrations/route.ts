import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"
import { registrationQuerySchema, bulkRegistrationSchema } from "@/lib/validations/registration"
import { successResponse, errorResponse, handleError, createPagination } from "@/lib/utils/api"
import { UserRole, RegistrationStatus, EventStatus } from "@prisma/client"

// Generate unique check-in code
function generateCheckInCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// GET /api/events/[id]/registrations - Get registrations for specific event
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: eventId } = await params
    const { searchParams } = new URL(request.url)
    const queryObj = Object.fromEntries(searchParams.entries())
    
    const query = registrationQuerySchema.parse(queryObj)
    const currentUser = await getCurrentUser()
    
    if (!currentUser) {
      return errorResponse("Authentication required", 401, "UNAUTHORIZED")
    }

    const userRole = (currentUser as any).role as UserRole
    const userId = (currentUser as any).id

    // Check if event exists and user has permission to view registrations
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        title: true,
        organizerId: true,
        status: true
      }
    })

    if (!event) {
      return errorResponse("Event not found", 404, "NOT_FOUND")
    }

    // Only event organizers and admins can view event registrations
    if (userRole !== UserRole.ADMIN && event.organizerId !== userId) {
      return errorResponse("You don't have permission to view these registrations", 403, "FORBIDDEN")
    }

    // Build where clause
    const where: any = { eventId }
    
    if (query.status) {
      where.status = query.status
    }

    // Calculate pagination
    const page = Math.max(1, query.page)
    const limit = Math.min(100, Math.max(1, query.limit))
    const skip = (page - 1) * limit

    // Get total count and registrations
    const [total, registrations] = await Promise.all([
      prisma.registration.count({ where }),
      prisma.registration.findMany({
        where,
        select: {
          id: true,
          status: true,
          registrationDate: true,
          checkInCode: true,
          notes: true,
          waitlistPosition: true,
          createdAt: true,
          updatedAt: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              organization: true,
              avatarUrl: true
            }
          }
        },
        orderBy: [
          { status: 'asc' }, // REGISTERED first, then WAITLISTED, then others
          { waitlistPosition: 'asc' },
          { registrationDate: 'asc' }
        ],
        skip,
        take: limit
      })
    ])

    const pagination = createPagination(total, page, limit)

    // Add summary statistics
    const summary = await prisma.registration.groupBy({
      by: ['status'],
      where: { eventId },
      _count: {
        status: true
      }
    })

    const stats = {
      total,
      registered: summary.find(s => s.status === RegistrationStatus.REGISTERED)?._count.status || 0,
      waitlisted: summary.find(s => s.status === RegistrationStatus.WAITLISTED)?._count.status || 0,
      attended: summary.find(s => s.status === RegistrationStatus.ATTENDED)?._count.status || 0,
      cancelled: summary.find(s => s.status === RegistrationStatus.CANCELLED)?._count.status || 0
    }

    return successResponse({
      registrations,
      stats,
      pagination
    }, "Event registrations retrieved successfully")

  } catch (error) {
    return handleError(error)
  }
}

// POST /api/events/[id]/registrations - Bulk register users for event (admin/organizer only)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: eventId } = await params
    const currentUser = await getCurrentUser()
    
    if (!currentUser) {
      return errorResponse("Authentication required", 401, "UNAUTHORIZED")
    }

    const userRole = (currentUser as any).role as UserRole
    const userId = (currentUser as any).id

    // Check if event exists and user has permission
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        title: true,
        organizerId: true,
        status: true,
        eventDate: true,
        registrationDeadline: true,
        capacity: true,
        allowWaitlist: true,
        _count: {
          select: {
            registrations: {
              where: {
                status: {
                  in: ['REGISTERED', 'ATTENDED']
                }
              }
            }
          }
        }
      }
    })

    if (!event) {
      return errorResponse("Event not found", 404, "NOT_FOUND")
    }

    // Only event organizers and admins can bulk register
    if (userRole !== UserRole.ADMIN && event.organizerId !== userId) {
      return errorResponse("You don't have permission to register users for this event", 403, "FORBIDDEN")
    }

    if (event.status !== EventStatus.PUBLISHED) {
      return errorResponse("Event is not available for registration", 400, "EVENT_NOT_AVAILABLE")
    }

    const body = await request.json()
    const validatedData = bulkRegistrationSchema.parse(body)

    // Verify all users exist
    const users = await prisma.user.findMany({
      where: {
        id: { in: validatedData.userIds }
      },
      select: { id: true }
    })

    if (users.length !== validatedData.userIds.length) {
      return errorResponse("Some users not found", 400, "USERS_NOT_FOUND")
    }

    // Check for existing registrations
    const existingRegistrations = await prisma.registration.findMany({
      where: {
        eventId,
        userId: { in: validatedData.userIds }
      },
      select: { userId: true }
    })

    if (existingRegistrations.length > 0) {
      const alreadyRegistered = existingRegistrations.map(r => r.userId)
      return errorResponse(`Users already registered: ${alreadyRegistered.join(', ')}`, 400, "USERS_ALREADY_REGISTERED")
    }

    // Calculate how many can be registered vs waitlisted
    const currentRegistrations = event._count.registrations
    const availableSpots = event.capacity ? Math.max(0, event.capacity - currentRegistrations) : validatedData.userIds.length
    
    const toRegister = validatedData.userIds.slice(0, availableSpots)
    const toWaitlist = validatedData.userIds.slice(availableSpots)

    if (toWaitlist.length > 0 && !event.allowWaitlist) {
      return errorResponse("Event is full and waitlist is not allowed", 400, "EVENT_FULL")
    }

    // Get next waitlist position if needed
    let nextWaitlistPosition = 0
    if (toWaitlist.length > 0) {
      const lastWaitlisted = await prisma.registration.findFirst({
        where: {
          eventId,
          status: RegistrationStatus.WAITLISTED
        },
        orderBy: { waitlistPosition: 'desc' }
      })
      nextWaitlistPosition = (lastWaitlisted?.waitlistPosition || 0)
    }

    // Create all registrations
    const registrations = await prisma.$transaction(
      validatedData.userIds.map((userId, index) => {
        const isWaitlisted = index >= availableSpots
        return prisma.registration.create({
          data: {
            userId,
            eventId,
            status: isWaitlisted ? RegistrationStatus.WAITLISTED : RegistrationStatus.REGISTERED,
            checkInCode: generateCheckInCode(),
            notes: validatedData.notes,
            waitlistPosition: isWaitlisted ? nextWaitlistPosition + (index - availableSpots) + 1 : null,
            registrationDate: new Date()
          },
          select: {
            id: true,
            status: true,
            waitlistPosition: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        })
      })
    )

    const registered = registrations.filter(r => r.status === RegistrationStatus.REGISTERED)
    const waitlisted = registrations.filter(r => r.status === RegistrationStatus.WAITLISTED)

    return successResponse({
      registered: registered.length,
      waitlisted: waitlisted.length,
      registrations
    }, `Bulk registration completed: ${registered.length} registered, ${waitlisted.length} waitlisted`, undefined, 201)

  } catch (error) {
    return handleError(error)
  }
}