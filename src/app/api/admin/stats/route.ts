import { prisma } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"
import { successResponse, errorResponse, handleError } from "@/lib/utils/api"
import { UserRole } from "@prisma/client"

// GET /api/admin/stats - Get platform statistics (admin only)
export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return errorResponse("Authentication required", 401, "UNAUTHORIZED")
    }

    const userRole = user.role as UserRole

    if (userRole !== "ADMIN") {
      return errorResponse("Admin access required", 403, "FORBIDDEN")
    }

    // Get platform statistics
    const [
      totalUsers,
      totalEvents,
      totalRegistrations,
      usersByRole,
      eventsByStatus,
      recentUsers,
      recentEvents
    ] = await Promise.all([
      // Total users
      prisma.user.count(),

      // Total events
      prisma.event.count(),

      // Total registrations
      prisma.registration.count(),

      // Users by role
      prisma.user.groupBy({
        by: ['role'],
        _count: {
          role: true
        }
      }),

      // Events by status
      prisma.event.groupBy({
        by: ['status'],
        _count: {
          status: true
        }
      }),

      // Recent users (last 5)
      prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 5
      }),

      // Recent events (last 5)
      prisma.event.findMany({
        select: {
          id: true,
          title: true,
          status: true,
          eventDate: true,
          createdAt: true,
          organizer: {
            select: {
              name: true
            }
          },
          _count: {
            select: {
              registrations: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 5
      })
    ])

    const stats = {
      overview: {
        totalUsers,
        totalEvents,
        totalRegistrations
      },
      usersByRole: usersByRole.reduce((acc, curr) => {
        acc[curr.role] = curr._count.role
        return acc
      }, {} as Record<string, number>),
      eventsByStatus: eventsByStatus.reduce((acc, curr) => {
        acc[curr.status] = curr._count.status
        return acc
      }, {} as Record<string, number>),
      recent: {
        users: recentUsers,
        events: recentEvents
      }
    }

    return successResponse(stats, "Platform statistics retrieved successfully")

  } catch (error) {
    return handleError(error)
  }
}
