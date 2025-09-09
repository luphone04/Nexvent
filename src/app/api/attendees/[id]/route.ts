import { NextRequest } from "next/server"
import { prisma } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"
import { updateAttendeeSchema } from "@/lib/validations/attendee"
import { successResponse, errorResponse, handleError } from "@/lib/utils/api"
import { UserRole } from "@prisma/client"

// GET /api/attendees/[id] - Get single attendee profile
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params
    const currentUser = await getCurrentUser()

    const attendee = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        organization: true,
        bio: true,
        interests: true,
        role: true,
        avatarUrl: true,
        privacy: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            registrations: {
              where: {
                status: {
                  in: ['REGISTERED', 'ATTENDED']
                }
              }
            },
            organizedEvents: {
              where: {
                status: 'PUBLISHED'
              }
            }
          }
        },
        registrations: {
          select: {
            id: true,
            status: true,
            registrationDate: true,
            event: {
              select: {
                id: true,
                title: true,
                eventDate: true,
                category: true,
                status: true
              }
            }
          },
          orderBy: {
            registrationDate: 'desc'
          },
          take: 10 // Show last 10 registrations
        },
        organizedEvents: {
          select: {
            id: true,
            title: true,
            eventDate: true,
            category: true,
            status: true,
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
          },
          where: {
            status: {
              in: ['PUBLISHED', 'COMPLETED']
            }
          },
          orderBy: {
            eventDate: 'desc'
          },
          take: 10 // Show last 10 organized events
        }
      }
    })

    if (!attendee) {
      return errorResponse("Attendee not found", 404, "NOT_FOUND")
    }

    const privacy = attendee.privacy as unknown || {
      showEmail: false,
      showPhone: false,
      showOrganization: true,
      showBio: true,
      showInterests: true,
      allowSearch: true
    }

    const isOwnProfile = currentUser && currentUser.id === attendee.id
    const isAdmin = currentUser && currentUser.role === UserRole.ADMIN

    // Always show full profile to owner and admin
    if (isOwnProfile || isAdmin) {
      return successResponse(attendee, "Profile retrieved successfully")
    }

    // Check if user allows being found
    if (!privacy.allowSearch) {
      return errorResponse("Profile not found", 404, "NOT_FOUND")
    }

    // Apply privacy settings for other users
    const filteredProfile = {
      ...attendee,
      email: privacy.showEmail ? attendee.email : null,
      phone: privacy.showPhone ? attendee.phone : null,
      organization: privacy.showOrganization ? attendee.organization : null,
      bio: privacy.showBio ? attendee.bio : null,
      interests: privacy.showInterests ? attendee.interests : [],
      privacy: undefined, // Don't expose privacy settings
      // Show only public organized events for non-owners
      organizedEvents: attendee.organizedEvents.filter(event => event.status === 'PUBLISHED')
    }

    return successResponse(filteredProfile, "Profile retrieved successfully")

  } catch (error) {
    return handleError(error)
  }
}

// PUT /api/attendees/[id] - Update attendee profile
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

    const userRole = currentUser.role as UserRole
    const userId = currentUser.id

    // Check if user can update this profile
    const isOwnProfile = userId === id
    const isAdmin = userRole === "ADMIN"

    if (!isOwnProfile && !isAdmin) {
      return errorResponse("You can only update your own profile", 403, "FORBIDDEN")
    }

    // Get the existing user to check if they exist
    const existingUser = await prisma.user.findUnique({
      where: { id }
    })

    if (!existingUser) {
      return errorResponse("Attendee not found", 404, "NOT_FOUND")
    }

    const body = await request.json()
    const validatedData = updateAttendeeSchema.parse(body)

    // Prepare update data
    const updateData: Record<string, unknown> = { ...validatedData }

    const updatedAttendee = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        organization: true,
        bio: true,
        interests: true,
        role: true,
        avatarUrl: true,
        privacy: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            registrations: {
              where: {
                status: {
                  in: ['REGISTERED', 'ATTENDED']
                }
              }
            },
            organizedEvents: {
              where: {
                status: 'PUBLISHED'
              }
            }
          }
        }
      }
    })

    return successResponse(updatedAttendee, "Profile updated successfully")

  } catch (error) {
    return handleError(error)
  }
}