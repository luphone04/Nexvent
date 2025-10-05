import { NextRequest } from "next/server"
import { prisma } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"
import { attendeeQuerySchema } from "@/lib/validations/attendee"
import { 
  successResponse, 
  handleError,
  createPagination 
} from "@/lib/utils/api"
import { UserRole } from "@prisma/client"

// GET /api/attendees - List attendees with filtering and search
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const queryObj = Object.fromEntries(searchParams.entries())
    
    const query = attendeeQuerySchema.parse(queryObj)
    const currentUser = await getCurrentUser()

    // Build where clause for filtering
    const where: Record<string, unknown> = {}
    
    if (query.role) {
      where.role = query.role
    }
    
    if (query.organization) {
      where.organization = {
        contains: query.organization,
        mode: 'insensitive'
      }
    }
    
    if (query.interests) {
      const interestArray = query.interests.split(',').map(i => i.trim())
      where.interests = {
        hasSome: interestArray
      }
    }
    
    if (query.search) {
      where.OR = [
        {
          name: {
            contains: query.search,
            mode: 'insensitive'
          }
        },
        {
          organization: {
            contains: query.search,
            mode: 'insensitive'
          }
        },
        {
          bio: {
            contains: query.search,
            mode: 'insensitive'
          }
        }
      ]
    }

    // Privacy filtering - only show users who allow search
    if (!query.includePrivate || !currentUser || currentUser.role !== UserRole.ADMIN) {
      // For now, we'll implement privacy in the response filtering
      // Later we can add a privacy JSON field query
    }

    // Calculate pagination
    const page = Math.max(1, query.page)
    const limit = Math.min(100, Math.max(1, query.limit))
    const skip = (page - 1) * limit

    // Get total count and attendees
    const [total, attendees] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
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
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      })
    ])

    // Apply privacy filtering to response
    const filteredAttendees = attendees.map(attendee => {
      const privacy = (attendee.privacy as Record<string, boolean>) || {
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
        return attendee
      }

      // Apply privacy settings for other users
      return {
        ...attendee,
        email: privacy.showEmail ? attendee.email : null,
        phone: privacy.showPhone ? attendee.phone : null,
        organization: privacy.showOrganization ? attendee.organization : null,
        bio: privacy.showBio ? attendee.bio : null,
        interests: privacy.showInterests ? attendee.interests : [],
        privacy: undefined // Don't expose privacy settings to others
      }
    })

    const pagination = createPagination(total, page, limit)

    return successResponse(filteredAttendees, undefined, pagination)

  } catch (error) {
    return handleError(error)
  }
}