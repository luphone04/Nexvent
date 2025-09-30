import { AppLayout } from '@/components/layout/app-layout'
import { CheckInView } from '@/components/events/check-in-view'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authConfig } from '@/lib/auth/config'

interface CheckInPageProps {
  params: Promise<{
    id: string
  }>
}

async function getEvent(eventId: string, userId: string, userRole: string) {
  try {
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const response = await fetch(`${baseUrl}/api/events/${eventId}`, {
      cache: 'no-store',
    })

    if (!response.ok) {
      return null
    }

    const data = await response.json()
    const event = data.data

    // Check if user is organizer or admin
    if (event.organizerId !== userId && userRole !== 'ADMIN') {
      return null
    }

    return event
  } catch (error) {
    console.error('Error fetching event:', error)
    return null
  }
}

export default async function CheckInPage({ params }: CheckInPageProps) {
  const session = await getServerSession(authConfig)
  const { id } = await params

  if (!session) {
    redirect(`/auth/signin?callbackUrl=/events/${id}/check-in`)
  }

  // Only organizers and admins can access check-in
  const userRole = session.user.role as string
  const userId = session.user.id

  if (userRole !== 'ORGANIZER' && userRole !== 'ADMIN') {
    return (
      <AppLayout>
        <div className="max-w-2xl mx-auto mt-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <h2 className="text-xl font-bold text-red-700 mb-2">Access Denied</h2>
            <p className="text-red-600">Only event organizers can access check-in.</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  const event = await getEvent(id, userId, userRole)

  if (!event) {
    return (
      <AppLayout>
        <div className="max-w-2xl mx-auto mt-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <h2 className="text-xl font-bold text-red-700 mb-2">Access Denied</h2>
            <p className="text-red-600">Event not found or you don&apos;t have permission to check in attendees.</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <CheckInView event={event} />
    </AppLayout>
  )
}
