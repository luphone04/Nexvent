import { AppLayout } from '@/components/layout/app-layout'
import { RegistrationForm } from '@/components/registration/registration-form'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authConfig } from '@/lib/auth/config'

interface RegisterPageProps {
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

export default async function RegisterPage({ params }: RegisterPageProps) {
  const session = await getServerSession(authConfig)
  const { id } = await params

  // Redirect to login if not authenticated
  if (!session) {
    redirect(`/auth/signin?callbackUrl=/events/${id}/register`)
  }

  const event = await getEvent(id)

  if (!event) {
    return (
      <AppLayout>
        <div className="max-w-2xl mx-auto mt-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <h2 className="text-xl font-bold text-red-700 mb-2">Event Not Found</h2>
            <p className="text-red-600">The event you are trying to register for does not exist.</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  // Check if event is cancelled
  if (event.status === 'CANCELLED') {
    return (
      <AppLayout>
        <div className="max-w-2xl mx-auto mt-8">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
            <h2 className="text-xl font-bold text-yellow-700 mb-2">Event Cancelled</h2>
            <p className="text-yellow-600">This event has been cancelled and is no longer accepting registrations.</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Register for Event</h1>
          <p className="text-gray-600">Complete the form below to register for {event.title}</p>
        </div>

        <RegistrationForm event={event} />
      </div>
    </AppLayout>
  )
}