import { NextRequest } from "next/server"
import { prisma } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"
import { z } from "zod"
import { successResponse, errorResponse, handleError } from "@/lib/utils/api"
import { UserRole, RegistrationStatus } from "@prisma/client"

const validateCheckInSchema = z.object({
  code: z.string().min(1, "Check-in code is required").max(10, "Invalid code format"),
  eventId: z.string().min(1, "Event ID is required").optional(),
})

// POST /api/checkin/validate - Validate check-in code without checking in
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    
    if (!currentUser) {
      return errorResponse("Authentication required", 401, "UNAUTHORIZED")
    }

    const userRole = currentUser.role as UserRole
    const userId = currentUser.id

    const body = await request.json()
    const { code, eventId } = validateCheckInSchema.parse(body)

    // Build where clause
    const where: Record<string, unknown> = {
      checkInCode: code.toUpperCase()
    }

    if (eventId) {
      where.eventId = eventId
    }

    // Find registration by check-in code
    const registration = await prisma.registration.findFirst({
      where,
      select: {
        id: true,
        status: true,
        registrationDate: true,
        checkInCode: true,
        waitlistPosition: true,
        checkInTime: true,
        attendeeId: true,
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
            organizerId: true,
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
      return successResponse({
        valid: false,
        reason: "INVALID_CODE",
        message: "Check-in code not found"
      }, "Check-in code validation completed")
    }

    // Check if user has permission to validate this code
    const canValidate = userRole === UserRole.ADMIN || 
                       registration.event.organizerId === userId ||
                       registration.attendeeId === userId

    if (!canValidate) {
      return errorResponse("You don't have permission to validate this check-in code", 403, "FORBIDDEN")
    }

    // Determine validation status and reasons
    let valid = true
    const reasons: string[] = []
    let message = "Check-in code is valid"

    // Check registration status
    if (registration.status === RegistrationStatus.ATTENDED) {
      valid = false
      reasons.push("ALREADY_CHECKED_IN")
      message = `${registration.attendee.name} is already checked in`
    } else if (registration.status === RegistrationStatus.WAITLISTED) {
      valid = false
      reasons.push("WAITLISTED")
      message = `${registration.attendee.name} is on the waitlist (position ${registration.waitlistPosition})`
    } else if (registration.status === RegistrationStatus.CANCELLED) {
      valid = false
      reasons.push("CANCELLED")
      message = "Registration has been cancelled"
    } else if (registration.status !== RegistrationStatus.REGISTERED) {
      valid = false
      reasons.push("INVALID_STATUS")
      message = `Cannot check in: registration status is ${registration.status}`
    }

    // Check event status
    if (registration.event.status !== 'PUBLISHED') {
      valid = false
      reasons.push("EVENT_NOT_PUBLISHED")
      message = "Event is not published"
    }

    // Check event timing
    const eventDateTime = new Date(`${registration.event.eventDate.toISOString().split('T')[0]}T${registration.event.eventTime || '00:00'}`)
    const now = new Date()
    const hoursUntilEvent = (eventDateTime.getTime() - now.getTime()) / (1000 * 60 * 60)
    const eventHasPassed = now > eventDateTime

    if (eventHasPassed) {
      valid = false
      reasons.push("EVENT_ENDED")
      message = "Event has already ended"
    } else if (hoursUntilEvent > 24) {
      // Allow check-in up to 24 hours before event
      valid = false
      reasons.push("TOO_EARLY")
      message = `Check-in opens 24 hours before event (${Math.round(hoursUntilEvent)} hours remaining)`
    }

    // If still valid, set success message
    if (valid) {
      message = `Ready to check in: ${registration.attendee.name}`
    }

    const response = {
      valid,
      reasons,
      message,
      registration: valid ? {
        id: registration.id,
        status: registration.status,
        attendee: registration.attendee,
        event: {
          id: registration.event.id,
          title: registration.event.title,
          eventDate: registration.event.eventDate,
          eventTime: registration.event.eventTime,
          location: registration.event.location
        },
        timing: {
          hoursUntilEvent: Math.round(hoursUntilEvent * 100) / 100,
          eventHasPassed,
          canCheckIn: valid
        }
      } : null
    }

    return successResponse(response, "Check-in code validation completed")

  } catch (error) {
    return handleError(error)
  }
}

// GET /api/checkin/validate?code=ABC123&eventId=xyz - Validate check-in code via query params
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const eventId = searchParams.get('eventId')

    if (!code) {
      return errorResponse("Check-in code is required", 400, "MISSING_CODE")
    }

    // Convert to POST data format and call POST handler
    const mockRequest = {
      json: async () => ({ code, eventId })
    } as NextRequest

    return POST(mockRequest)

  } catch (error) {
    return handleError(error)
  }
}