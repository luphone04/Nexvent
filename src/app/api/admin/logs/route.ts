import { NextRequest } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { z } from "zod"
import { successResponse, errorResponse, handleError } from "@/lib/utils/api"
import { UserRole } from "@prisma/client"
import { APILogger } from "@/lib/middleware/logging"

const logsQuerySchema = z.object({
  method: z.enum(["GET", "POST", "PUT", "DELETE", "PATCH"]).optional(),
  userId: z.string().optional(),
  status: z.string().optional().transform(val => val ? parseInt(val) : undefined),
  fromDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  toDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  limit: z.string().optional().default("50").transform(val => Math.min(500, Math.max(1, parseInt(val))))
})

// GET /api/admin/logs - Get API request logs (admin only)
export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    
    if (!currentUser) {
      return errorResponse("Authentication required", 401, "UNAUTHORIZED")
    }

    const userRole = currentUser.role as UserRole

    if (userRole !== UserRole.ADMIN) {
      return errorResponse("Admin access required", 403, "FORBIDDEN")
    }

    const { searchParams } = new URL(request.url)
    const queryObj = Object.fromEntries(searchParams.entries())
    const query = logsQuerySchema.parse(queryObj)

    // Get filtered logs
    const logs = APILogger.getLogs({
      method: query.method,
      userId: query.userId,
      status: query.status,
      fromDate: query.fromDate,
      toDate: query.toDate,
      limit: query.limit
    })

    // Get statistics
    const stats = APILogger.getStats()

    return successResponse({
      logs,
      stats,
      totalReturned: logs.length
    }, "API logs retrieved successfully")

  } catch (error) {
    return handleError(error)
  }
}

// DELETE /api/admin/logs - Clear API logs (admin only)
export async function DELETE(_request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    
    if (!currentUser) {
      return errorResponse("Authentication required", 401, "UNAUTHORIZED")
    }

    const userRole = currentUser.role as UserRole

    if (userRole !== UserRole.ADMIN) {
      return errorResponse("Admin access required", 403, "FORBIDDEN")
    }

    APILogger.clearLogs()

    return successResponse(null, "API logs cleared successfully")

  } catch (error) {
    return handleError(error)
  }
}