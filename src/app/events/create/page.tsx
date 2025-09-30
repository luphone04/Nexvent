import { AppLayout } from '@/components/layout/app-layout'
import { EventForm } from '@/components/events/event-form'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authConfig } from '@/lib/auth/config'

export default async function CreateEventPage() {
  const session = await getServerSession(authConfig)

  // Only organizers and admins can create events
  if (!session || (session.user.role !== 'ORGANIZER' && session.user.role !== 'ADMIN')) {
    redirect('/auth/signin?callbackUrl=/events/create')
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-2">Create New Event</h1>
        <p className="text-gray-600 mb-8">Fill in the details below to create your event</p>

        <EventForm />
      </div>
    </AppLayout>
  )
}