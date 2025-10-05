import { NextRequest } from "next/server"
import { prisma } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"
import { updateRegistrationSchema } from "@/lib/validations/registration"
import { successResponse, errorResponse, handleError } from "@/lib/utils/api"
import { UserRole, RegistrationStatus } from "@prisma/client"

// GET /api/registrations/[id] - Get single registration
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const currentUser = await getCurrentUser()
    
    if (!currentUser) {
      return errorResponse("Authentication required", 401, "UNAUTHORIZED")
    }

    const userRole = currentUser.role as UserRole
    const userId = currentUser.id

    const registration = await prisma.registration.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        registrationDate: true,
        checkInCode: true,
        specialRequirements: true,
        checkInTime: true,
        waitlistPosition: true,
        createdAt: true,
        updatedAt: true,
        attendee: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true
          }
        },
        event: {
          select: {
            id: true,
            title: true,
            eventDate: true,
            eventTime: true,
            location: true,
            category: true,
            status: true,
            capacity: true,
            organizerId: true,
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
        }
      }
    })

    if (!registration) {
      return errorResponse("Registration not found", 404, "NOT_FOUND")
    }

    // Check if user can access this registration
    const canAccess = userRole === UserRole.ADMIN || 
                     registration.attendee.id === userId || 
                     registration.event.organizerId === userId

    if (!canAccess) {
      return errorResponse("You don't have permission to view this registration", 403, "FORBIDDEN")
    }

    return successResponse(registration, "Registration retrieved successfully")

  } catch (error) {
    return handleError(error)
  }
}

// PUT /api/registrations/[id] - Update registration
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const currentUser = await getCurrentUser()
    
    if (!currentUser) {
      return errorResponse("Authentication required", 401, "UNAUTHORIZED")
    }

    const userRole = currentUser.role as UserRole
    const userId = currentUser.id

    // Get existing registration
    const existingRegistration = await prisma.registration.findUnique({
      where: { id },
      select: {
        id: true,
        attendeeId: true,
        status: true,
        event: {
          select: {
            id: true,
            organizerId: true,
            eventDate: true,
            status: true
          }
        }
      }
    })

    if (!existingRegistration) {
      return errorResponse("Registration not found", 404, "NOT_FOUND")
    }

    // Check permissions
    const canUpdate = userRole === UserRole.ADMIN || 
                     existingRegistration.event.organizerId === userId ||
                     (existingRegistration.attendeeId === userId && userRole !== UserRole.ATTENDEE) // Attendees can only update notes

    if (!canUpdate) {
      return errorResponse("You don't have permission to update this registration", 403, "FORBIDDEN")
    }

    const body = await request.json()
    const validatedData = updateRegistrationSchema.parse(body)

    // Restrict attendees to only updating notes
    if (userRole === UserRole.ATTENDEE && existingRegistration.attendeeId === userId) {
      if (validatedData.status !== undefined) {
        return errorResponse("Attendees cannot change registration status", 403, "FORBIDDEN")
      }
    }

    // Prevent updates after event has passed
    if (new Date() > new Date(existingRegistration.event.eventDate)) {
      return errorResponse("Cannot update registration for past events", 400, "EVENT_EXPIRED")
    }

    const updatedRegistration = await prisma.registration.update({
      where: { id },
      data: validatedData,
      select: {
        id: true,
        status: true,
        registrationDate: true,
        checkInCode: true,
        specialRequirements: true,
        checkInTime: true,
        waitlistPosition: true,
        createdAt: true,
        updatedAt: true,
        attendee: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true
          }
        },
        event: {
          select: {
            id: true,
            title: true,
            eventDate: true,
            eventTime: true,
            location: true,
            category: true,
            status: true
          }
        }
      }
    })

    return successResponse(updatedRegistration, "Registration updated successfully")

  } catch (error) {
    return handleError(error)
  }
}

// DELETE /api/registrations/[id] - Cancel registration
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const currentUser = await getCurrentUser()
    
    if (!currentUser) {
      return errorResponse("Authentication required", 401, "UNAUTHORIZED")
    }

    const userRole = currentUser.role as UserRole
    const userId = currentUser.id

    // Get registration with event details
    const registration = await prisma.registration.findUnique({
      where: { id },
      select: {
        id: true,
        attendeeId: true,
        status: true,
        waitlistPosition: true,
        event: {
          select: {
            id: true,
            title: true,
            organizerId: true,
            eventDate: true,
            status: true,
            capacity: true,
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
        }
      }
    })

    if (!registration) {
      return errorResponse("Registration not found", 404, "NOT_FOUND")
    }

    // Check permissions - users can cancel their own, organizers can cancel for their events, admins can cancel any
    const canCancel = userRole === UserRole.ADMIN ||
                     registration.attendeeId === userId ||
                     registration.event.organizerId === userId

    if (!canCancel) {
      return errorResponse("You don't have permission to cancel this registration", 403, "FORBIDDEN")
    }

    // Check if cancellation is allowed based on timing
    const hoursUntilEvent = (new Date(registration.event.eventDate).getTime() - new Date().getTime()) / (1000 * 60 * 60)
    
    if (hoursUntilEvent < 24 && registration.attendeeId === userId && userRole === UserRole.ATTENDEE) {
      return errorResponse("Registrations cannot be cancelled less than 24 hours before the event", 400, "CANCELLATION_NOT_ALLOWED")
    }

    // Prevent cancellation if event has already happened
    if (new Date() > new Date(registration.event.eventDate)) {
      return errorResponse("Cannot cancel registration for past events", 400, "EVENT_EXPIRED")
    }

    // Cannot cancel if already attended
    if (registration.status === RegistrationStatus.ATTENDED) {
      return errorResponse("Cannot cancel registration after attendance", 400, "ALREADY_ATTENDED")
    }

    // Use transaction to handle cancellation and waitlist promotion
    const result = await prisma.$transaction(async (tx) => {
      // Cancel the registration
      const cancelledRegistration = await tx.registration.update({
        where: { id },
        data: { 
          status: RegistrationStatus.CANCELLED 
        }
      })

      // If this was a registered user (not waitlisted), promote next person from waitlist
      if (registration.status === RegistrationStatus.REGISTERED) {
        const nextWaitlisted = await tx.registration.findFirst({
          where: {
            eventId: registration.event.id,
            status: RegistrationStatus.WAITLISTED
          },
          orderBy: {
            waitlistPosition: 'asc'
          }
        })

        if (nextWaitlisted) {
          await tx.registration.update({
            where: { id: nextWaitlisted.id },
            data: {
              status: RegistrationStatus.REGISTERED,
              waitlistPosition: null
            }
          })

          // Update waitlist positions for remaining waitlisted users
          await tx.registration.updateMany({
            where: {
              eventId: registration.event.id,
              status: RegistrationStatus.WAITLISTED,
              waitlistPosition: {
                gt: nextWaitlisted.waitlistPosition || 0
              }
            },
            data: {
              waitlistPosition: {
                decrement: 1
              }
            }
          })
        }
      }

      return cancelledRegistration
    })

    return successResponse({ id: result.id }, "Registration cancelled successfully")

  } catch (error) {
    return handleError(error)
  }
}