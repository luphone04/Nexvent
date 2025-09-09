import { NextRequest } from "next/server"
import { prisma } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"
import { checkInSchema } from "@/lib/validations/registration"
import { successResponse, errorResponse, handleError } from "@/lib/utils/api"
import { UserRole, RegistrationStatus } from "@prisma/client"

// POST /api/events/[id]/checkin - Check in attendee using code
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

    const userRole = currentUser.role as UserRole
    const userId = currentUser.id

    // Check if event exists
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        title: true,
        organizerId: true,
        eventDate: true,
        status: true
      }
    })

    if (!event) {
      return errorResponse("Event not found", 404, "NOT_FOUND")
    }

    // Only event organizers and admins can check in attendees
    if (userRole !== UserRole.ADMIN && event.organizerId !== userId) {
      return errorResponse("You don't have permission to check in attendees for this event", 403, "FORBIDDEN")
    }

    const body = await request.json()
    const { code } = checkInSchema.parse(body)

    // Find registration by check-in code
    const registration = await prisma.registration.findFirst({
      where: {
        eventId,
        checkInCode: code.toUpperCase()
      },
      select: {
        id: true,
        status: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true
          }
        }
      }
    })

    if (!registration) {
      return errorResponse("Invalid check-in code", 400, "INVALID_CODE")
    }

    // Check if already checked in
    if (registration.status === RegistrationStatus.ATTENDED) {
      return successResponse(
        registration, 
        `${registration.user.name} is already checked in`
      )
    }

    // Only registered users can be checked in (not waitlisted)
    if (registration.status !== RegistrationStatus.REGISTERED) {
      return errorResponse(
        `Cannot check in: registration status is ${registration.status}`, 
        400, 
        "INVALID_STATUS"
      )
    }

    // Update registration status to attended
    const updatedRegistration = await prisma.registration.update({
      where: { id: registration.id },
      data: { status: RegistrationStatus.ATTENDED },
      select: {
        id: true,
        status: true,
        checkInCode: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true
          }
        }
      }
    })

    return successResponse(
      updatedRegistration, 
      `${registration.user.name} checked in successfully`
    )

  } catch (error) {
    return handleError(error)
  }
}

// GET /api/events/[id]/checkin - Get check-in statistics
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: eventId } = await params
    const currentUser = await getCurrentUser()
    
    if (!currentUser) {
      return errorResponse("Authentication required", 401, "UNAUTHORIZED")
    }

    const userRole = currentUser.role as UserRole
    const userId = currentUser.id

    // Check if event exists and user has permission
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        title: true,
        organizerId: true
      }
    })

    if (!event) {
      return errorResponse("Event not found", 404, "NOT_FOUND")
    }

    if (userRole !== UserRole.ADMIN && event.organizerId !== userId) {
      return errorResponse("You don't have permission to view check-in data", 403, "FORBIDDEN")
    }

    // Get check-in statistics
    const stats = await prisma.registration.groupBy({
      by: ['status'],
      where: { eventId },
      _count: {
        status: true
      }
    })

    const checkInStats = {
      total: stats.reduce((sum, s) => sum + s._count.status, 0),
      registered: stats.find(s => s.status === RegistrationStatus.REGISTERED)?._count.status || 0,
      attended: stats.find(s => s.status === RegistrationStatus.ATTENDED)?._count.status || 0,
      waitlisted: stats.find(s => s.status === RegistrationStatus.WAITLISTED)?._count.status || 0,
      cancelled: stats.find(s => s.status === RegistrationStatus.CANCELLED)?._count.status || 0,
      attendanceRate: 0
    }

    const eligible = checkInStats.registered + checkInStats.attended
    if (eligible > 0) {
      checkInStats.attendanceRate = Math.round((checkInStats.attended / eligible) * 100)
    }

    // Get recent check-ins
    const recentCheckIns = await prisma.registration.findMany({
      where: {
        eventId,
        status: RegistrationStatus.ATTENDED
      },
      select: {
        id: true,
        updatedAt: true,
        user: {
          select: {
            name: true,
            avatarUrl: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      },
      take: 10
    })

    return successResponse({
      stats: checkInStats,
      recentCheckIns
    }, "Check-in statistics retrieved successfully")

  } catch (error) {
    return handleError(error)
  }
}