import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { successResponse, errorResponse, handleError } from '@/lib/utils/api'
import { UserRole } from '@prisma/client'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    const { id } = await params

    if (!user || user.role !== UserRole.ADMIN) {
      return errorResponse('Admin access required', 403, 'FORBIDDEN')
    }

    // Prevent deleting admin users
    const userToDelete = await prisma.user.findUnique({ where: { id } })
    if (userToDelete?.role === UserRole.ADMIN) {
      return errorResponse('Cannot delete admin users', 400, 'FORBIDDEN')
    }

    await prisma.user.delete({ where: { id } })

    return successResponse(null, 'User deleted successfully')
  } catch (error) {
    return handleError(error)
  }
}
