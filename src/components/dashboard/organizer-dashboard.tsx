"use client"

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { LoadingCard } from '@/components/ui/loading'
import { ErrorMessage } from '@/components/ui/error-boundary'

interface Event {
  id: string
  title: string
  description: string
  eventDate: string
  eventTime?: string
  location: string
  category: string
  status: string
  capacity?: number
  imageUrl?: string
  _count: {
    registrations: number
  }
}

interface Analytics {
  totalEvents: number
  totalRegistrations: number
  upcomingEvents: number
  attendedEvents: number
}

export function OrganizerDashboard() {
  const { data: session } = useSession()
  const [events, setEvents] = useState<Event[]>([])
  const [analytics, setAnalytics] = useState<Analytics>({
    totalEvents: 0,
    totalRegistrations: 0,
    upcomingEvents: 0,
    attendedEvents: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchOrganizerData = async () => {
      try {
        // Fetch organizer's events
        const eventsResponse = await fetch('/api/events?organizer=me')
        if (!eventsResponse.ok) {
          throw new Error('Failed to fetch events')
        }
        const eventsData = await eventsResponse.json()
        const organizerEvents = eventsData.data || []
        setEvents(organizerEvents)

        // Calculate analytics
        const now = new Date()
        const upcomingCount = organizerEvents.filter((e: Event) =>
          new Date(e.eventDate) > now
        ).length
        const totalRegistrationsCount = organizerEvents.reduce((sum: number, e: Event) =>
          sum + e._count.registrations, 0
        )

        setAnalytics({
          totalEvents: organizerEvents.length,
          totalRegistrations: totalRegistrationsCount,
          upcomingEvents: upcomingCount,
          attendedEvents: organizerEvents.length - upcomingCount
        })
      } catch (err) {
        setError('Unable to load dashboard data')
      } finally {
        setLoading(false)
      }
    }

    if (session) {
      fetchOrganizerData()
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
      DRAFT: 'bg-gray-100 text-gray-800',
      PUBLISHED: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-red-100 text-red-800',
      COMPLETED: 'bg-blue-100 text-blue-800'
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
      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0h6m-6 0l-6 4v10a2 2 0 002 2h12a2 2 0 002-2V11l-6-4z" />
              </svg>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Total Events</dt>
                <dd className="text-lg font-medium text-gray-900">{analytics.totalEvents}</dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Total Registrations</dt>
                <dd className="text-lg font-medium text-gray-900">{analytics.totalRegistrations}</dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-8 w-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Upcoming Events</dt>
                <dd className="text-lg font-medium text-gray-900">{analytics.upcomingEvents}</dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-8 w-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H9a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Avg. Registration Rate</dt>
                <dd className="text-lg font-medium text-gray-900">
                  {analytics.totalEvents > 0
                    ? Math.round((analytics.totalRegistrations / analytics.totalEvents) * 100) / 100
                    : 0
                  }
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Button asChild className="justify-start">
            <Link href="/events/create">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create New Event
            </Link>
          </Button>
          <Button variant="outline" asChild className="justify-start">
            <Link href="/events?status=draft">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Manage Drafts
            </Link>
          </Button>
          <Button variant="outline" asChild className="justify-start">
            <Link href="/analytics">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H9a2 2 0 01-2-2z" />
              </svg>
              View Analytics
            </Link>
          </Button>
          <Button variant="outline" asChild className="justify-start">
            <Link href="/registrations">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
              Manage Registrations
            </Link>
          </Button>
        </div>
      </div>

      {/* Recent Events */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">Your Events</h2>
            <Button variant="outline" size="sm" asChild>
              <Link href="/events/create">Create New Event</Link>
            </Button>
          </div>
        </div>
        <div className="p-6">
          {loading ? (
            <div className="grid gap-4">
              {[1, 2, 3].map(i => <LoadingCard key={i} />)}
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-8">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0h6m-6 0l-6 4v10a2 2 0 002 2h12a2 2 0 002-2V11l-6-4z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No events created</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by creating your first event.</p>
              <div className="mt-6">
                <Button asChild>
                  <Link href="/events/create">Create Event</Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {events.slice(0, 5).map((event) => (
                <div key={event.id} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
                  <div className="flex-shrink-0">
                    {event.imageUrl ? (
                      <img
                        src={event.imageUrl}
                        alt={event.title}
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
                        {event.title}
                      </p>
                      {getStatusBadge(event.status)}
                    </div>
                    <p className="text-sm text-gray-500">
                      {formatDate(event.eventDate)}
                      {event.eventTime && ` at ${event.eventTime}`}
                    </p>
                    <p className="text-sm text-gray-500">{event.location}</p>
                    <div className="flex items-center space-x-4 mt-1">
                      <span className="text-sm text-blue-600">
                        {event._count.registrations} registered
                        {event.capacity && ` / ${event.capacity}`}
                      </span>
                      <span className="text-xs text-gray-500">{event.category}</span>
                    </div>
                  </div>
                  <div className="flex-shrink-0 flex space-x-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/events/${event.id}/edit`}>Edit</Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/events/${event.id}`}>View</Link>
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