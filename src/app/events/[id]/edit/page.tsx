import { AppLayout } from '@/components/layout/app-layout'
import { EventForm } from '@/components/events/event-form'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authConfig } from '@/lib/auth/config'

interface EditEventPageProps {
  params: Promise<{
    id: string
  }>
}

async function getEvent(eventId: string) {
  try {
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const response = await fetch(`${baseUrl}/api/events/${eventId}`, {
      cache: 'no-store',
    })

    if (!response.ok) {
      return null
    }

    const data = await response.json()
    return data.data
  } catch (error) {
    console.error('Error fetching event:', error)
    return null
  }
}

export default async function EditEventPage({ params }: EditEventPageProps) {
  const session = await getServerSession(authConfig)
  const { id } = await params

  if (!session) {
    redirect(`/auth/signin?callbackUrl=/events/${id}/edit`)
  }

  // Allow organizers and admins to edit
  const userRole = session.user.role as string
  const userId = session.user.id

  const event = await getEvent(id)

  if (!event) {
    return (
      <AppLayout>
        <div className="max-w-2xl mx-auto mt-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <h2 className="text-xl font-bold text-red-700 mb-2">Access Denied</h2>
            <p className="text-red-600">You do not have permission to edit this event, or the event was not found.</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  // Additional check: Allow admins to edit any event
  if (event.organizerId !== userId && userRole !== 'ADMIN') {
    return (
      <AppLayout>
        <div className="max-w-2xl mx-auto mt-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <h2 className="text-xl font-bold text-red-700 mb-2">Access Denied</h2>
            <p className="text-red-600">You can only edit events that you created.</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  // Format dates for the form
  const eventDate = new Date(event.eventDate).toISOString().split('T')[0]

  const initialData = {
    title: event.title,
    description: event.description || '',
    eventDate: eventDate,
    eventTime: event.eventTime || '',
    location: event.location,
    category: event.category,
    capacity: event.capacity,
    ticketPrice: typeof event.ticketPrice === 'string' ? parseFloat(event.ticketPrice) : event.ticketPrice,
    imageUrl: event.imageUrl || '',
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-2">Edit Event</h1>
        <p className="text-gray-600 mb-8">Update your event details</p>

        <EventForm eventId={id} initialData={initialData} />
      </div>
    </AppLayout>
  )
}