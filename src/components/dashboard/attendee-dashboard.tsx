"use client"

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { LoadingCard } from '@/components/ui/loading'
import { ErrorMessage } from '@/components/ui/error-boundary'
import { apiClient } from '@/lib/utils/api-client'

interface Registration {
  id: string
  status: string
  checkInTime?: string
  registrationDate: string
  event: {
    id: string
    title: string
    description: string
    eventDate: string
    eventTime?: string
    location: string
    category: string
    imageUrl?: string
  }
}

export function AttendeeDashboard() {
  const { data: session } = useSession()
  const [upcomingEvents, setUpcomingEvents] = useState<Registration[]>([])
  const [pastEvents, setPastEvents] = useState<Registration[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchRegistrations = async () => {
      try {
        const response = await apiClient.get('/api/registrations')
        if (!response.ok) {
          throw new Error('Failed to fetch registrations')
        }
        const data = await response.json()
        const registrations = data.data || []

        const now = new Date()
        const upcoming = registrations.filter((reg: Registration) =>
          new Date(reg.event.eventDate) > now
        )
        const past = registrations.filter((reg: Registration) =>
          new Date(reg.event.eventDate) <= now
        )

        setUpcomingEvents(upcoming)
        setPastEvents(past)
      } catch (err) {
        setError('Unable to load your registrations')
      } finally {
        setLoading(false)
      }
    }

    if (session) {
      fetchRegistrations()
    }
  }, [session])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getStatusBadge = (status: string) => {
    const statusColors = {
      REGISTERED: 'bg-blue-100 text-blue-800',
      ATTENDED: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-red-100 text-red-800',
      WAITLISTED: 'bg-yellow-100 text-yellow-800'
    }

    return (
      <span className={`px-2 py-1 text-xs rounded-full ${statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    )
  }

  if (error) {
    return <ErrorMessage message={error} />
  }

  return (
    <div className="space-y-8">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0h6m-6 0l-6 4v10a2 2 0 002 2h12a2 2 0 002-2V11l-6-4z" />
              </svg>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Upcoming Events</dt>
                <dd className="text-lg font-medium text-gray-900">{upcomingEvents.length}</dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Events Attended</dt>
                <dd className="text-lg font-medium text-gray-900">
                  {pastEvents.filter(e => e.status === 'ATTENDED').length}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-8 w-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Total Registrations</dt>
                <dd className="text-lg font-medium text-gray-900">
                  {upcomingEvents.length + pastEvents.length}
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming Events */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">Upcoming Events</h2>
            <Button variant="outline" size="sm" asChild>
              <Link href="/events">Browse More Events</Link>
            </Button>
          </div>
        </div>
        <div className="p-6">
          {loading ? (
            <div className="grid gap-4">
              {[1, 2, 3].map(i => <LoadingCard key={i} />)}
            </div>
          ) : upcomingEvents.length === 0 ? (
            <div className="text-center py-8">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0h6m-6 0l-6 4v10a2 2 0 002 2h12a2 2 0 002-2V11l-6-4z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No upcoming events</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by browsing and registering for events.</p>
              <div className="mt-6">
                <Button asChild>
                  <Link href="/events">Browse Events</Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingEvents.slice(0, 3).map((registration) => (
                <div key={registration.id} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
                  <div className="flex-shrink-0">
                    {registration.event.imageUrl ? (
                      <img
                        src={registration.event.imageUrl}
                        alt={registration.event.title}
                        className="h-16 w-16 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="h-16 w-16 bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg flex items-center justify-center">
                        <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0h6m-6 0l-6 4v10a2 2 0 002 2h12a2 2 0 002-2V11l-6-4z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {registration.event.title}
                      </p>
                      {getStatusBadge(registration.status)}
                    </div>
                    <p className="text-sm text-gray-500">
                      {formatDate(registration.event.eventDate)}
                      {registration.event.eventTime && ` at ${registration.event.eventTime}`}
                    </p>
                    <p className="text-sm text-gray-500">{registration.event.location}</p>
                  </div>
                  <div className="flex-shrink-0">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/events/${registration.event.id}`}>View Details</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Registration History */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Registration History</h2>
        </div>
        <div className="p-6">
          {loading ? (
            <div className="grid gap-4">
              {[1, 2, 3].map(i => <LoadingCard key={i} />)}
            </div>
          ) : pastEvents.length === 0 ? (
            <div className="text-center py-8">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No past events</h3>
              <p className="mt-1 text-sm text-gray-500">Your attended events will appear here.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pastEvents.slice(0, 5).map((registration) => (
                <div key={registration.id} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
                  <div className="flex-shrink-0">
                    {registration.event.imageUrl ? (
                      <img
                        src={registration.event.imageUrl}
                        alt={registration.event.title}
                        className="h-16 w-16 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="h-16 w-16 bg-gradient-to-r from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
                        <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0h6m-6 0l-6 4v10a2 2 0 002 2h12a2 2 0 002-2V11l-6-4z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {registration.event.title}
                      </p>
                      {getStatusBadge(registration.status)}
                    </div>
                    <p className="text-sm text-gray-500">
                      {formatDate(registration.event.eventDate)}
                      {registration.event.eventTime && ` at ${registration.event.eventTime}`}
                    </p>
                    <p className="text-sm text-gray-500">{registration.event.location}</p>
                    {registration.checkInTime && (
                      <p className="text-xs text-green-600">
                        Checked in: {new Date(registration.checkInTime).toLocaleString()}
                      </p>
                    )}
                  </div>
                  <div className="flex-shrink-0">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/events/${registration.event.id}`}>View Event</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}