import { NextRequest } from "next/server"
import { prisma } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"
import { 
  createEventSchema, 
  eventQuerySchema
} from "@/lib/validations/event"
import { 
  successResponse, 
  errorResponse, 
  handleError,
  createPagination 
} from "@/lib/utils/api"
import { EventStatus, UserRole } from "@prisma/client"

// GET /api/events - List events with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const queryObj = Object.fromEntries(searchParams.entries())
    
    const query = eventQuerySchema.parse(queryObj)

    // Build where clause for filtering
    const where: Record<string, unknown> = {}
    
    if (query.category) {
      where.category = query.category
    }
    
    if (query.location) {
      where.location = {
        contains: query.location,
        mode: 'insensitive'
      }
    }
    
    if (query.dateFrom || query.dateTo) {
      where.eventDate = {}
      if (query.dateFrom) {
        where.eventDate.gte = new Date(query.dateFrom)
      }
      if (query.dateTo) {
        where.eventDate.lte = new Date(query.dateTo)
      }
    }
    
    if (query.priceMin !== undefined || query.priceMax !== undefined) {
      where.ticketPrice = {}
      if (query.priceMin !== undefined) {
        where.ticketPrice.gte = query.priceMin
      }
      if (query.priceMax !== undefined) {
        where.ticketPrice.lte = query.priceMax
      }
    }
    
    if (query.organizerId) {
      where.organizerId = query.organizerId
    }
    
    if (query.status) {
      where.status = query.status
    } else {
      // By default, only show published events to non-organizers
      const user = await getCurrentUser()
      if (!user || !["ORGANIZER", "ADMIN"].includes(user.role as string)) {
        where.status = EventStatus.PUBLISHED
      }
    }
    
    if (query.search) {
      where.OR = [
        {
          title: {
            contains: query.search,
            mode: 'insensitive'
          }
        },
        {
          description: {
            contains: query.search,
            mode: 'insensitive'
          }
        }
      ]
    }

    // Calculate pagination
    const page = Math.max(1, query.page)
    const limit = Math.min(100, Math.max(1, query.limit)) // Max 100 items per page
    const skip = (page - 1) * limit

    // Get total count and events
    const [total, events] = await Promise.all([
      prisma.event.count({ where }),
      prisma.event.findMany({
        where,
        include: {
          organizer: {
            select: {
              id: true,
              name: true,
              email: true,
              organization: true
            }
          },
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
        orderBy: {
          eventDate: 'asc'
        },
        skip,
        take: limit
      })
    ])

    const pagination = createPagination(total, page, limit)

    return successResponse(events, undefined, pagination)

  } catch (error) {
    return handleError(error)
  }
}

// POST /api/events - Create new event
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return errorResponse("Authentication required", 401, "UNAUTHORIZED")
    }

    const userRole = user.role as UserRole
    if (!["ORGANIZER", "ADMIN"].includes(userRole)) {
      return errorResponse("Only organizers can create events", 403, "FORBIDDEN")
    }

    const body = await request.json()
    const validatedData = createEventSchema.parse(body)

    // Convert eventDate string to Date object
    const eventData = {
      ...validatedData,
      eventDate: new Date(validatedData.eventDate),
      organizerId: user.id,
    }

    const event = await prisma.event.create({
      data: eventData,
      include: {
        organizer: {
          select: {
            id: true,
            name: true,
            email: true,
            organization: true
          }
        },
        _count: {
          select: {
            registrations: true
          }
        }
      }
    })

    return successResponse(
      event, 
      "Event created successfully",
    )

  } catch (error) {
    return handleError(error)
  }
}