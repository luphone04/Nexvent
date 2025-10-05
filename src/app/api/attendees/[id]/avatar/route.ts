import { NextRequest } from "next/server"
import { prisma } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"
import { uploadProfileImage } from "@/lib/utils/upload"
import { successResponse, errorResponse, handleError } from "@/lib/utils/api"
import { UserRole } from "@prisma/client"

// POST /api/attendees/[id]/avatar - Upload profile avatar
export async function POST(
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

    // Only allow updating own avatar or admin
    if (userId !== id && userRole !== UserRole.ADMIN) {
      return errorResponse("You can only update your own avatar", 403, "FORBIDDEN")
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id }
    })

    if (!existingUser) {
      return errorResponse("User not found", 404, "NOT_FOUND")
    }

    // Upload the image
    const uploadResult = await uploadProfileImage(request)

    if (!uploadResult.success) {
      return errorResponse(uploadResult.error || "Upload failed", 400, "UPLOAD_ERROR")
    }

    // Update user's avatar URL in database
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        avatarUrl: uploadResult.url
      },
      select: {
        id: true,
        avatarUrl: true
      }
    })

    return successResponse(
      {
        avatarUrl: updatedUser.avatarUrl,
        uploadedFile: uploadResult.url
      },
      "Avatar updated successfully"
    )

  } catch (error) {
    return handleError(error)
  }
}

// DELETE /api/attendees/[id]/avatar - Remove profile avatar
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

    // Only allow removing own avatar or admin
    if (userId !== id && userRole !== UserRole.ADMIN) {
      return errorResponse("You can only remove your own avatar", 403, "FORBIDDEN")
    }

    // Update user's avatar URL to null
    await prisma.user.update({
      where: { id },
      data: {
        avatarUrl: null
      }
    })

    return successResponse(
      { avatarUrl: null },
      "Avatar removed successfully"
    )

  } catch (error) {
    return handleError(error)
  }
}