import { NextRequest } from "next/server"
import { prisma } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"
import { 
  createRegistrationSchema, 
  registrationQuerySchema
} from "@/lib/validations/registration"
import { 
  successResponse, 
  errorResponse, 
  handleError,
  createPagination 
} from "@/lib/utils/api"
import { UserRole, EventStatus, RegistrationStatus } from "@prisma/client"

// Generate unique check-in code
function generateCheckInCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// GET /api/registrations - List registrations with filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const queryObj = Object.fromEntries(searchParams.entries())
    
    const query = registrationQuerySchema.parse(queryObj)
    const currentUser = await getCurrentUser()
    
    if (!currentUser) {
      return errorResponse("Authentication required", 401, "UNAUTHORIZED")
    }

    const userRole = currentUser.role as UserRole
    const userId = currentUser.id

    // Build where clause for filtering
    const where: Record<string, unknown> = {}
    
    if (query.status) {
      where.status = query.status
    }
    
    if (query.eventId) {
      where.eventId = query.eventId
    }
    
    if (query.userId) {
      where.attendeeId = query.userId
    }
    
    // Date filtering
    if (query.fromDate || query.toDate) {
      where.registrationDate = {}
      if (query.fromDate) {
        where.registrationDate.gte = new Date(query.fromDate)
      }
      if (query.toDate) {
        where.registrationDate.lte = new Date(query.toDate)
      }
    }

    // Filter expired events unless specifically requested
    if (!query.includeExpired) {
      where.event = {
        eventDate: {
          gte: new Date()
        }
      }
    }

    // Non-admin users can only see their own registrations or registrations for events they organize
    if (userRole !== UserRole.ADMIN) {
      where.OR = [
        { attendeeId: userId }, // Own registrations
        { 
          event: { 
            organizerId: userId // Registrations for events they organize
          }
        }
      ]
    }

    // Calculate pagination
    const page = Math.max(1, query.page)
    const limit = Math.min(100, Math.max(1, query.limit))
    const skip = (page - 1) * limit

    // Get total count and registrations
    const [total, registrations] = await Promise.all([
      prisma.registration.count({ where }),
      prisma.registration.findMany({
        where,
        select: {
          id: true,
          status: true,
          registrationDate: true,
          checkInCode: true,
          notes: true,
          waitlistPosition: true,
          createdAt: true,
          updatedAt: true,
          attendee: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true
            }
          },
          event: {
            select: {
              id: true,
              title: true,
              eventDate: true,
              location: true,
              category: true,
              status: true,
              capacity: true,
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
            }
          }
        },
        orderBy: {
          registrationDate: 'desc'
        },
        skip,
        take: limit
      })
    ])

    const pagination = createPagination(total, page, limit)

    return successResponse(registrations, undefined, pagination)

  } catch (error) {
    return handleError(error)
  }
}

// POST /api/registrations - Create new registration
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    
    if (!currentUser) {
      return errorResponse("Authentication required", 401, "UNAUTHORIZED")
    }

    const userId = currentUser.id
    const body = await request.json()
    const validatedData = createRegistrationSchema.parse(body)

    // Check if event exists and is published
    const event = await prisma.event.findUnique({
      where: { id: validatedData.eventId },
      select: {
        id: true,
        title: true,
        status: true,
        eventDate: true,
        registrationDeadline: true,
        capacity: true,
        organizerId: true,
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
      }
    })

    if (!event) {
      return errorResponse("Event not found", 404, "NOT_FOUND")
    }

    if (event.status !== EventStatus.PUBLISHED) {
      return errorResponse("Event is not available for registration", 400, "EVENT_NOT_AVAILABLE")
    }

    // Check if registration is still open
    if (event.registrationDeadline && new Date() > new Date(event.registrationDeadline)) {
      return errorResponse("Registration deadline has passed", 400, "REGISTRATION_CLOSED")
    }

    // Check if event has already happened
    if (new Date() > new Date(event.eventDate)) {
      return errorResponse("Cannot register for past events", 400, "EVENT_EXPIRED")
    }

    // Check if user is already registered
    const existingRegistration = await prisma.registration.findUnique({
      where: {
        attendeeId_eventId: {
          attendeeId: userId,
          eventId: validatedData.eventId
        }
      }
    })

    if (existingRegistration) {
      return errorResponse("You are already registered for this event", 400, "ALREADY_REGISTERED")
    }

    // Check capacity and determine registration status
    const currentRegistrations = event._count.registrations
    let registrationStatus = RegistrationStatus.REGISTERED
    let waitlistPosition: number | null = null

    if (event.capacity && currentRegistrations >= event.capacity) {
      // Get next waitlist position
      const lastWaitlistRegistration = await prisma.registration.findFirst({
        where: {
          eventId: validatedData.eventId,
          status: RegistrationStatus.WAITLISTED
        },
        orderBy: {
          waitlistPosition: 'desc'
        }
      })

      registrationStatus = RegistrationStatus.WAITLISTED
      waitlistPosition = (lastWaitlistRegistration?.waitlistPosition || 0) + 1
    }

    // Create registration
    const registration = await prisma.registration.create({
      data: {
        attendeeId: userId,
        eventId: validatedData.eventId,
        status: registrationStatus,
        checkInCode: generateCheckInCode(),
        notes: validatedData.notes,
        waitlistPosition,
        registrationDate: new Date()
      },
      select: {
        id: true,
        status: true,
        registrationDate: true,
        checkInCode: true,
        notes: true,
        waitlistPosition: true,
        createdAt: true,
        updatedAt: true,
        attendee: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true
          }
        },
        event: {
          select: {
            id: true,
            title: true,
            eventDate: true,
            location: true,
            category: true,
            status: true
          }
        }
      }
    })

    const message = registrationStatus === RegistrationStatus.REGISTERED 
      ? "Registration successful" 
      : `Added to waitlist at position ${waitlistPosition}`

    return successResponse(registration, message, undefined, 201)

  } catch (error) {
    return handleError(error)
  }
}