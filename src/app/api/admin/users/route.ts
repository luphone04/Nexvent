import { prisma } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"
import { successResponse, errorResponse, handleError } from "@/lib/utils/api"
import { UserRole } from "@prisma/client"

// GET /api/admin/users - Get all users (admin only)
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

    // Get all users with their event and registration counts
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        organization: true,
        createdAt: true,
        _count: {
          select: {
            organizedEvents: true,
            registrations: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return successResponse(users, "Users retrieved successfully")

  } catch (error) {
    return handleError(error)
  }
}
