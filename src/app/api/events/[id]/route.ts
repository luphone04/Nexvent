import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"
import { updateEventSchema, type UpdateEventInput } from "@/lib/validations/event"
import { successResponse, errorResponse, handleError } from "@/lib/utils/api"
import { EventStatus, UserRole } from "@prisma/client"

// GET /api/events/[id] - Get single event
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params

    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        organizer: {
          select: {
            id: true,
            name: true,
            email: true,
            organization: true
          }
        },
        registrations: {
          select: {
            id: true,
            status: true,
            attendee: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
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
      }
    })

    if (!event) {
      return errorResponse("Event not found", 404, "NOT_FOUND")
    }

    // Check if user can view this event
    const user = await getCurrentUser()
    const userRole = user ? (user as any).role as UserRole : null
    const isOrganizer = user && (user as any).id === event.organizerId
    const isAdmin = userRole === "ADMIN"

    // Non-published events can only be viewed by organizer/admin
    if (event.status !== EventStatus.PUBLISHED && !isOrganizer && !isAdmin) {
      return errorResponse("Event not found", 404, "NOT_FOUND")
    }

    // Hide sensitive registration data for non-organizers
    if (!isOrganizer && !isAdmin) {
      event.registrations = []
    }

    return successResponse(event, "Event retrieved successfully")

  } catch (error) {
    return handleError(error)
  }
}

// PUT /api/events/[id] - Update event
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params
    const user = await getCurrentUser()
    
    if (!user) {
      return errorResponse("Authentication required", 401, "UNAUTHORIZED")
    }

    const userRole = (user as any).role as UserRole
    const userId = (user as any).id

    // Get the event to check ownership
    const existingEvent = await prisma.event.findUnique({
      where: { id }
    })

    if (!existingEvent) {
      return errorResponse("Event not found", 404, "NOT_FOUND")
    }

    // Check if user can update this event
    const isOrganizer = userId === existingEvent.organizerId
    const isAdmin = userRole === "ADMIN"

    if (!isOrganizer && !isAdmin) {
      return errorResponse("You can only update your own events", 403, "FORBIDDEN")
    }

    const body = await request.json()
    const validatedData = updateEventSchema.parse(body)

    // Prepare update data
    const updateData: any = { ...validatedData }
    
    if (validatedData.eventDate) {
      updateData.eventDate = new Date(validatedData.eventDate)
    }

    const updatedEvent = await prisma.event.update({
      where: { id },
      data: updateData,
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
      }
    })

    return successResponse(updatedEvent, "Event updated successfully")

  } catch (error) {
    return handleError(error)
  }
}

// DELETE /api/events/[id] - Cancel/Delete event
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params
    const user = await getCurrentUser()
    
    if (!user) {
      return errorResponse("Authentication required", 401, "UNAUTHORIZED")
    }

    const userRole = (user as any).role as UserRole
    const userId = (user as any).id

    // Get the event to check ownership
    const existingEvent = await prisma.event.findUnique({
      where: { id },
      include: {
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

    if (!existingEvent) {
      return errorResponse("Event not found", 404, "NOT_FOUND")
    }

    // Check if user can delete this event
    const isOrganizer = userId === existingEvent.organizerId
    const isAdmin = userRole === "ADMIN"

    if (!isOrganizer && !isAdmin) {
      return errorResponse("You can only delete your own events", 403, "FORBIDDEN")
    }

    // Soft delete by setting status to CANCELLED
    const cancelledEvent = await prisma.event.update({
      where: { id },
      data: {
        status: EventStatus.CANCELLED
      },
      include: {
        organizer: {
          select: {
            id: true,
            name: true,
            email: true,
            organization: true
          }
        }
      }
    })

    return successResponse(
      cancelledEvent, 
      `Event cancelled successfully. ${existingEvent._count.registrations} attendees will need to be notified.`
    )

  } catch (error) {
    return handleError(error)
  }
}