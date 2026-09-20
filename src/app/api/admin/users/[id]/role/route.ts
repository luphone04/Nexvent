import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { successResponse, errorResponse, handleError } from '@/lib/utils/api'
import { UserRole } from '@prisma/client'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    const { id } = await params

    if (!user || user.role !== UserRole.ADMIN) {
      return errorResponse('Admin access required', 403, 'FORBIDDEN')
    }

    const { role } = await request.json()

    if (!['ATTENDEE', 'ORGANIZER', 'ADMIN'].includes(role)) {
      return errorResponse('Invalid role', 400, 'INVALID_ROLE')
    }

    if (id === user.id && role !== 'ADMIN') {
      return errorResponse('You cannot remove your own admin access', 400, 'SELF_DEMOTION')
    }
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { role },
      select: { id: true, name: true, email: true, role: true }
    })

    return successResponse(updatedUser, 'User role updated successfully')
  } catch (error) {
    return handleError(error)
  }
}
