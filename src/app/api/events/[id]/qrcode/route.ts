import { NextRequest } from "next/server"
import { prisma } from "@/lib/db"
import { successResponse, errorResponse, handleError } from "@/lib/utils/api"
import QRCode from 'qrcode'

// GET /api/events/[id]/qrcode - Generate QR code for event (for registration or info)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: eventId } = await params
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'registration' // 'registration' or 'info'
    
    // Get event details
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        title: true,
        description: true,
        eventDate: true,
        eventTime: true,
        location: true,
        capacity: true,
        category: true,
        status: true,
        organizerId: true,
        organizer: {
          select: {
            name: true,
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

    if (!event) {
      return errorResponse("Event not found", 404, "NOT_FOUND")
    }

    let qrData: Record<string, unknown> = {}
    
    if (type === 'registration') {
      // QR code for registration
      qrData = {
        type: "EVENT_REGISTRATION",
        eventId: event.id,
        title: event.title,
        eventDate: event.eventDate,
        eventTime: event.eventTime,
        location: event.location,
        registrationUrl: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/events/${event.id}/register`,
        timestamp: new Date().toISOString()
      }
    } else if (type === 'info') {
      // QR code for event information
      qrData = {
        type: "EVENT_INFO",
        eventId: event.id,
        title: event.title,
        description: event.description,
        eventDate: event.eventDate,
        eventTime: event.eventTime,
        location: event.location,
        capacity: event.capacity,
        category: event.category,
        organizer: event.organizer.name,
        organization: event.organizer.organization,
        registered: event._count.registrations,
        status: event.status,
        eventUrl: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/events/${event.id}`,
        timestamp: new Date().toISOString()
      }
    } else {
      return errorResponse("Invalid QR code type. Use 'registration' or 'info'", 400, "INVALID_TYPE")
    }

    // Generate QR code
    const [qrCodeDataURL, qrCodeSVG] = await Promise.all([
      QRCode.toDataURL(JSON.stringify(qrData), {
        errorCorrectionLevel: 'M',
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        width: 256
      }),
      QRCode.toString(JSON.stringify(qrData), {
        type: 'svg',
        errorCorrectionLevel: 'M',
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        width: 256
      })
    ])

    return successResponse({
      event: {
        id: event.id,
        title: event.title,
        eventDate: event.eventDate,
        location: event.location,
        status: event.status
      },
      qrCode: {
        type,
        dataURL: qrCodeDataURL,
        svg: qrCodeSVG,
        data: qrData
      }
    }, `Event ${type} QR code generated successfully`)

  } catch (error) {
    return handleError(error)
  }
}