import { NextRequest } from "next/server"
import { prisma } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"
import { successResponse, errorResponse, handleError } from "@/lib/utils/api"
import { UserRole } from "@prisma/client"

// POST /api/registrations/check-in - Check in an attendee
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return errorResponse("Authentication required", 401, "UNAUTHORIZED")
    }

    const userRole = user.role as UserRole

    // Only organizers and admins can check in attendees
    if (userRole !== "ORGANIZER" && userRole !== "ADMIN") {
      return errorResponse("Only organizers can check in attendees", 403, "FORBIDDEN")
    }

    const body = await request.json()
    const { qrData } = body

    // Parse QR code data
    let parsedData
    try {
      parsedData = JSON.parse(qrData)
    } catch {
      return errorResponse("Invalid QR code format", 400, "INVALID_QR_CODE")
    }

    const { registrationId, checkInCode } = parsedData

    if (!registrationId || !checkInCode) {
      return errorResponse("Invalid QR code data", 400, "INVALID_QR_CODE")
    }

    // Find the registration
    const registration = await prisma.registration.findUnique({
      where: { id: registrationId },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            eventDate: true,
            organizerId: true
          }
        },
        attendee: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    if (!registration) {
      return errorResponse("Registration not found", 404, "NOT_FOUND")
    }

    // Verify check-in code matches
    if (registration.checkInCode !== checkInCode) {
      return errorResponse("Invalid check-in code", 400, "INVALID_CODE")
    }

    // Check if user is the event organizer or admin
    const isOrganizer = user.id === registration.event.organizerId
    const isAdmin = userRole === "ADMIN"

    if (!isOrganizer && !isAdmin) {
      return errorResponse("You can only check in attendees for your own events", 403, "FORBIDDEN")
    }

    // Check if already checked in
    if (registration.checkInTime) {
      return successResponse(
        {
          ...registration,
          alreadyCheckedIn: true
        },
        "Attendee was already checked in"
      )
    }

    // Check if registration is cancelled
    if (registration.status === "CANCELLED") {
      return errorResponse("This registration has been cancelled", 400, "REGISTRATION_CANCELLED")
    }

    // Check if on waitlist
    if (registration.status === "WAITLISTED") {
      return errorResponse("This attendee is on the waitlist", 400, "ON_WAITLIST")
    }

    // Perform check-in
    const updatedRegistration = await prisma.registration.update({
      where: { id: registrationId },
      data: {
        status: "ATTENDED",
        checkInTime: new Date()
      },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            eventDate: true
          }
        },
        attendee: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    return successResponse(
      updatedRegistration,
      `Successfully checked in ${updatedRegistration.attendee.name}`
    )

  } catch (error) {
    return handleError(error)
  }
}
