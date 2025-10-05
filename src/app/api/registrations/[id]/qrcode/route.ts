import { NextRequest } from "next/server"
import { prisma } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"
import { successResponse, errorResponse, handleError } from "@/lib/utils/api"
import { UserRole } from "@prisma/client"
import QRCode from 'qrcode'

// GET /api/registrations/[id]/qrcode - Generate QR code for registration
export async function GET(
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

    // Get registration details
    const registration = await prisma.registration.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        checkInCode: true,
        attendeeId: true,
        attendee: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        event: {
          select: {
            id: true,
            title: true,
            eventDate: true,
            location: true,
            organizerId: true
          }
        }
      }
    })

    if (!registration) {
      return errorResponse("Registration not found", 404, "NOT_FOUND")
    }

    // Check permissions - user can access their own QR code, organizers can access QR codes for their events, admins can access all
    const canAccess = userRole === UserRole.ADMIN || 
                     registration.attendeeId === userId || 
                     registration.event.organizerId === userId

    if (!canAccess) {
      return errorResponse("You don't have permission to view this QR code", 403, "FORBIDDEN")
    }

    // Create QR code data with check-in information
    const qrData = {
      type: "EVENT_CHECK_IN",
      registrationId: registration.id,
      eventId: registration.event.id,
      checkInCode: registration.checkInCode,
      attendeeName: registration.attendee.name,
      eventTitle: registration.event.title,
      eventDate: registration.event.eventDate,
      location: registration.event.location,
      timestamp: new Date().toISOString()
    }

    // Generate QR code as data URL
    const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(qrData), {
      errorCorrectionLevel: 'M',
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      width: 256
    })

    // Also generate as SVG for scalability
    const qrCodeSVG = await QRCode.toString(JSON.stringify(qrData), {
      type: 'svg',
      errorCorrectionLevel: 'M',
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      width: 256
    })

    return successResponse({
      registration: {
        id: registration.id,
        status: registration.status,
        checkInCode: registration.checkInCode,
        attendee: registration.attendee,
        event: {
          id: registration.event.id,
          title: registration.event.title,
          eventDate: registration.event.eventDate,
          location: registration.event.location
        }
      },
      qrCode: {
        dataURL: qrCodeDataURL,
        svg: qrCodeSVG,
        data: qrData
      }
    }, "QR code generated successfully")

  } catch (error) {
    return handleError(error)
  }
}

// POST /api/registrations/[id]/qrcode - Regenerate QR code (admin/organizer only)
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

    // Get registration details
    const registration = await prisma.registration.findUnique({
      where: { id },
      select: {
        id: true,
        checkInCode: true,
        attendeeId: true,
        event: {
          select: {
            organizerId: true
          }
        }
      }
    })

    if (!registration) {
      return errorResponse("Registration not found", 404, "NOT_FOUND")
    }

    // Only admins and event organizers can regenerate QR codes
    const canRegenerate = userRole === UserRole.ADMIN || 
                         registration.event.organizerId === userId

    if (!canRegenerate) {
      return errorResponse("You don't have permission to regenerate this QR code", 403, "FORBIDDEN")
    }

    // Generate new check-in code
    function generateCheckInCode(): string {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
      let result = ''
      for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length))
      }
      return result
    }

    // Update registration with new check-in code
    const updatedRegistration = await prisma.registration.update({
      where: { id },
      data: { checkInCode: generateCheckInCode() },
      select: {
        id: true,
        status: true,
        checkInCode: true,
        attendee: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        event: {
          select: {
            id: true,
            title: true,
            eventDate: true,
            location: true
          }
        }
      }
    })

    // Create new QR code data
    const qrData = {
      type: "EVENT_CHECK_IN",
      registrationId: updatedRegistration.id,
      eventId: updatedRegistration.event.id,
      checkInCode: updatedRegistration.checkInCode,
      attendeeName: updatedRegistration.attendee.name,
      eventTitle: updatedRegistration.event.title,
      eventDate: updatedRegistration.event.eventDate,
      location: updatedRegistration.event.location,
      timestamp: new Date().toISOString(),
      regenerated: true
    }

    // Generate new QR codes
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
      registration: updatedRegistration,
      qrCode: {
        dataURL: qrCodeDataURL,
        svg: qrCodeSVG,
        data: qrData
      }
    }, "QR code regenerated successfully")

  } catch (error) {
    return handleError(error)
  }
}