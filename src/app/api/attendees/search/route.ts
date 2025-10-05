import { NextRequest } from "next/server"
import { prisma } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"
import { z } from "zod"
import { successResponse, handleError } from "@/lib/utils/api"
import { UserRole } from "@prisma/client"

const searchSchema = z.object({
  q: z.string().min(1, "Search query is required").max(100, "Search query too long"),
  type: z.enum(["all", "organizers", "attendees"]).default("all"),
  limit: z.string().optional().default("20").transform((val) => parseInt(val, 10))
})

// GET /api/attendees/search - Search attendees
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const queryObj = Object.fromEntries(searchParams.entries())
    
    const { q, type, limit } = searchSchema.parse(queryObj)
    const currentUser = await getCurrentUser()

    // Build search conditions
    const searchConditions = [
      {
        name: {
          contains: q,
          mode: 'insensitive' as const
        }
      },
      {
        organization: {
          contains: q,
          mode: 'insensitive' as const
        }
      }
    ]

    // Add role filter based on search type
    const where: Record<string, unknown> = {
      OR: searchConditions
    }

    if (type === "organizers") {
      where.role = {
        in: [UserRole.ORGANIZER, UserRole.ADMIN]
      }
    } else if (type === "attendees") {
      where.role = UserRole.ATTENDEE
    }

    const searchLimit = Math.min(50, Math.max(1, limit))

    const results = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        organization: true,
        role: true,
        avatarUrl: true,
        privacy: true,
        _count: {
          select: {
            organizedEvents: {
              where: {
                status: 'PUBLISHED'
              }
            },
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
      take: searchLimit,
      orderBy: [
        {
          role: 'desc' // Prioritize organizers/admins
        },
        {
          name: 'asc'
        }
      ]
    })

    // Apply privacy filtering
    const filteredResults = results
      .filter(user => {
        const privacy = (user.privacy as Record<string, boolean>) || { allowSearch: true }
        // Always show if it's the current user or if user is admin
        const isCurrentUser = currentUser && currentUser.id === user.id
        const isAdmin = currentUser && currentUser.role === UserRole.ADMIN

        return isCurrentUser || isAdmin || privacy.allowSearch
      })
      .map(user => {
        const privacy = (user.privacy as Record<string, boolean>) || {
          showEmail: false,
          showOrganization: true
        }

        const isCurrentUser = currentUser && currentUser.id === user.id
        const isAdmin = currentUser && currentUser.role === UserRole.ADMIN

        // Show full profile to current user and admin
        if (isCurrentUser || isAdmin) {
          return {
            ...user,
            privacy: undefined
          }
        }

        // Apply privacy for others
        return {
          id: user.id,
          name: user.name,
          email: privacy.showEmail ? user.email : null,
          organization: privacy.showOrganization ? user.organization : null,
          role: user.role,
          avatarUrl: user.avatarUrl,
          _count: user._count,
          privacy: undefined
        }
      })

    return successResponse(
      filteredResults,
      `Found ${filteredResults.length} ${type === 'all' ? 'users' : type}`
    )

  } catch (error) {
    return handleError(error)
  }
}