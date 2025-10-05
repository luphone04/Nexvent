import { AppLayout } from '@/components/layout/app-layout'
import { getServerSession } from 'next-auth'
import { authConfig } from '@/lib/auth/config'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'

interface AttendeesPageProps {
  params: Promise<{
    id: string
  }>
}

async function getEventWithAttendees(eventId: string, userId: string) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: {
      id: true,
      title: true,
      organizerId: true,
      registrations: {
        where: {
          status: {
            in: ['REGISTERED', 'ATTENDED', 'WAITLISTED']
          }
        },
        select: {
          id: true,
          status: true,
          registrationDate: true,
          checkInTime: true,
          specialRequirements: true,
          attendee: {
            select: {
              name: true,
              email: true,
            }
          }
        },
        orderBy: {
          registrationDate: 'desc'
        }
      }
    }
  })

  if (!event || event.organizerId !== userId) {
    return null
  }

  return event
}

export default async function AttendeesPage({ params }: AttendeesPageProps) {
  const session = await getServerSession(authConfig)
  const { id } = await params

  if (!session) {
    redirect(`/auth/signin?callbackUrl=/events/${id}/attendees`)
  }

  const event = await getEventWithAttendees(id, session.user.id)

  if (!event) {
    return (
      <AppLayout>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <h2 className="text-xl font-bold text-red-700 mb-2">Access Denied</h2>
            <p className="text-red-600">You can only view attendees for events you created.</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Attendee List</h1>
          <p className="text-gray-600">{event.title}</p>
          <p className="text-sm text-gray-500 mt-1">
            Total Attendees: {event.registrations.length}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Attendee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Registered
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Special Requirements
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Check-in
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {event.registrations.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      No attendees yet
                    </td>
                  </tr>
                ) : (
                  event.registrations.map((registration) => (
                    <tr key={registration.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {registration.attendee.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {registration.attendee.email}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          registration.status === 'ATTENDED'
                            ? 'bg-green-100 text-green-800'
                            : registration.status === 'REGISTERED'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {registration.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(registration.registrationDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {registration.specialRequirements || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {registration.checkInTime
                          ? new Date(registration.checkInTime).toLocaleString()
                          : '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
