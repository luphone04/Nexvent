import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"
import { profilePrivacySchema, type ProfilePrivacy } from "@/lib/validations/attendee"
import { successResponse, errorResponse, handleError } from "@/lib/utils/api"
import { UserRole } from "@prisma/client"

// GET /api/attendees/[id]/privacy - Get privacy settings
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params
    const currentUser = await getCurrentUser()
    
    if (!currentUser) {
      return errorResponse("Authentication required", 401, "UNAUTHORIZED")
    }

    const userRole = (currentUser as any).role as UserRole
    const userId = (currentUser as any).id

    // Only allow viewing own privacy settings or admin
    if (userId !== id && userRole !== UserRole.ADMIN) {
      return errorResponse("Access denied", 403, "FORBIDDEN")
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        privacy: true
      }
    })

    if (!user) {
      return errorResponse("User not found", 404, "NOT_FOUND")
    }

    // Return privacy settings or defaults
    const privacy = user.privacy as ProfilePrivacy || {
      showEmail: false,
      showPhone: false,
      showOrganization: true,
      showBio: true,
      showInterests: true,
      allowSearch: true
    }

    return successResponse(privacy, "Privacy settings retrieved")

  } catch (error) {
    return handleError(error)
  }
}

// PUT /api/attendees/[id]/privacy - Update privacy settings
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params
    const currentUser = await getCurrentUser()
    
    if (!currentUser) {
      return errorResponse("Authentication required", 401, "UNAUTHORIZED")
    }

    const userId = (currentUser as any).id

    // Only allow updating own privacy settings
    if (userId !== id) {
      return errorResponse("You can only update your own privacy settings", 403, "FORBIDDEN")
    }

    const body = await request.json()
    const validatedPrivacy = profilePrivacySchema.parse(body)

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        privacy: validatedPrivacy
      },
      select: {
        privacy: true
      }
    })

    return successResponse(updatedUser.privacy, "Privacy settings updated successfully")

  } catch (error) {
    return handleError(error)
  }
}