import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"
import { registrationQuerySchema } from "@/lib/validations/registration"
import { successResponse, errorResponse, handleError, createPagination } from "@/lib/utils/api"
import { UserRole, RegistrationStatus } from "@prisma/client"

// GET /api/attendees/[id]/registrations - Get registration history for specific attendee
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: attendeeId } = await params
    const { searchParams } = new URL(request.url)
    const queryObj = Object.fromEntries(searchParams.entries())
    
    const query = registrationQuerySchema.parse(queryObj)
    const currentUser = await getCurrentUser()
    
    if (!currentUser) {
      return errorResponse("Authentication required", 401, "UNAUTHORIZED")
    }

    const userRole = (currentUser as any).role as UserRole
    const userId = (currentUser as any).id

    // Check if attendee exists
    const attendee = await prisma.user.findUnique({
      where: { id: attendeeId },
      select: {
        id: true,
        name: true,
        role: true
      }
    })

    if (!attendee) {
      return errorResponse("Attendee not found", 404, "NOT_FOUND")
    }

    // Check permissions - users can view their own history, organizers can view registrations for their events, admins can view all
    const isOwnProfile = userId === attendeeId
    
    if (!isOwnProfile && userRole !== UserRole.ADMIN) {
      // For non-admin, non-owner, we need to check if they're viewing registrations for events they organize
      // This will be handled in the where clause below
    }

    // Build where clause
    const where: any = { userId: attendeeId }
    
    if (query.status) {
      where.status = query.status
    }

    if (query.eventId) {
      where.eventId = query.eventId
    }

    // Date filtering
    if (query.fromDate || query.toDate) {
      where.registrationDate = {}
      if (query.fromDate) {
        where.registrationDate.gte = new Date(query.fromDate)
      }
      if (query.toDate) {
        where.registrationDate.lte = new Date(query.toDate)
      }
    }

    // Filter expired events unless specifically requested
    if (!query.includeExpired) {
      where.event = {
        eventDate: {
          gte: new Date()
        }
      }
    }

    // If not own profile and not admin, only show registrations for events the current user organizes
    if (!isOwnProfile && userRole !== UserRole.ADMIN) {
      where.event = {
        ...where.event,
        organizerId: userId
      }
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
          checkInCode: isOwnProfile || userRole === UserRole.ADMIN ? true : false, // Only show check-in code to owner/admin
          notes: true,
          waitlistPosition: true,
          createdAt: true,
          updatedAt: true,
          event: {
            select: {
              id: true,
              title: true,
              eventDate: true,
              location: true,
              category: true,
              status: true,
              capacity: true,
              organizerId: true,
              organizer: {
                select: {
                  name: true,
                  organization: true
                }
              },
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
        },
        orderBy: {
          registrationDate: 'desc'
        },
        skip,
        take: limit
      })
    ])

    // Filter out check-in codes if not authorized to see them
    const filteredRegistrations = registrations.map(reg => ({
      ...reg,
      checkInCode: (isOwnProfile || userRole === UserRole.ADMIN) ? reg.checkInCode : undefined
    }))

    const pagination = createPagination(total, page, limit)

    // Add summary statistics for the attendee
    const summary = await prisma.registration.groupBy({
      by: ['status'],
      where: { userId: attendeeId },
      _count: {
        status: true
      }
    })

    const stats = {
      total: summary.reduce((sum, s) => sum + s._count.status, 0),
      registered: summary.find(s => s.status === RegistrationStatus.REGISTERED)?._count.status || 0,
      attended: summary.find(s => s.status === RegistrationStatus.ATTENDED)?._count.status || 0,
      waitlisted: summary.find(s => s.status === RegistrationStatus.WAITLISTED)?._count.status || 0,
      cancelled: summary.find(s => s.status === RegistrationStatus.CANCELLED)?._count.status || 0
    }

    // Calculate attendance rate
    const totalEligible = stats.registered + stats.attended
    const attendanceRate = totalEligible > 0 ? Math.round((stats.attended / totalEligible) * 100) : 0

    return successResponse({
      attendee: {
        id: attendee.id,
        name: attendee.name
      },
      registrations: filteredRegistrations,
      stats: {
        ...stats,
        attendanceRate
      },
      pagination
    }, "Registration history retrieved successfully")

  } catch (error) {
    return handleError(error)
  }
}