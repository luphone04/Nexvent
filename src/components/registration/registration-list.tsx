'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { apiClient } from '@/lib/utils/api-client'

interface Registration {
  id: string
  status: string
  registrationDate: string
  checkInDate?: string | null
  checkInTime?: string | null
  event: {
    id: string
    title: string
    eventDate: string
    eventTime: string | null
    location: string
    category: string
    ticketPrice?: number | string
  }
}

export function RegistrationList() {
  const { data: session } = useSession()
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('all')

  useEffect(() => {
    if (!session?.user?.id) return

    const fetchRegistrations = async () => {
      try {
        const response = await apiClient.get(`/api/attendees/${session.user.id}/registrations`)
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to load registrations')
        }

        // The API returns paginated data with registrations array
        setRegistrations(data.data?.registrations || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load registrations')
      } finally {
        setIsLoading(false)
      }
    }

    fetchRegistrations()
  }, [session])

  const handleCancelRegistration = async (registrationId: string) => {
    if (!confirm('Are you sure you want to cancel this registration?')) {
      return
    }

    try {
      const response = await apiClient.delete(`/api/registrations/${registrationId}`)

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to cancel registration')
      }

      // Remove from list
      setRegistrations(prev => prev.filter(reg => reg.id !== registrationId))
      alert('Registration cancelled successfully')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to cancel registration')
    }
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      REGISTERED: 'bg-green-100 text-green-800',
      WAITLISTED: 'bg-yellow-100 text-yellow-800',
      CANCELLED: 'bg-red-100 text-red-800',
      CHECKED_IN: 'bg-blue-100 text-blue-800',
    }
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    )
  }

  const formatPrice = (price?: number | string) => {
    if (!price || price === 0) return 'Free'
    const numPrice = typeof price === 'string' ? parseFloat(price) : price
    if (isNaN(numPrice)) return 'Free'
    return `$${numPrice.toFixed(2)}`
  }

  const filteredRegistrations = registrations.filter(reg => {
    const eventDate = new Date(reg.event.eventDate)
    const now = new Date()

    if (filter === 'upcoming') {
      return eventDate >= now
    } else if (filter === 'past') {
      return eventDate < now
    }
    return true
  })

  if (!session) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <p className="text-yellow-800">Please sign in to view your registrations.</p>
          <Link
            href="/auth/signin"
            className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Sign In
          </Link>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your registrations...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">My Registrations</h1>
        <p className="text-gray-600">Manage your event registrations and tickets</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 border-b">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            filter === 'all'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-800'
          }`}
        >
          All ({registrations.length})
        </button>
        <button
          onClick={() => setFilter('upcoming')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            filter === 'upcoming'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-800'
          }`}
        >
          Upcoming ({registrations.filter(r => new Date(r.event.eventDate) >= new Date()).length})
        </button>
        <button
          onClick={() => setFilter('past')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            filter === 'past'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-800'
          }`}
        >
          Past ({registrations.filter(r => new Date(r.event.eventDate) < new Date()).length})
        </button>
      </div>

      {/* Registrations List */}
      {filteredRegistrations.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="text-gray-600 mb-4">No registrations found</p>
          <Link
            href="/events"
            className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Browse Events
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRegistrations.map((registration) => {
            const eventDate = new Date(registration.event.eventDate)
            const isPast = eventDate < new Date()
            const canCancel = !isPast && registration.status === 'REGISTERED'

            return (
              <div key={registration.id} className="bg-white rounded-lg border p-6 hover:shadow-lg transition-shadow">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <Link
                          href={`/events/${registration.event.id}`}
                          className="text-xl font-semibold hover:text-blue-600 transition-colors"
                        >
                          {registration.event.title}
                        </Link>
                        <div className="flex items-center gap-2 mt-1">
                          {getStatusBadge(registration.status)}
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                            {registration.event.category}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {eventDate.toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                        {registration.event.eventTime && ` at ${registration.event.eventTime}`}
                      </div>
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        </svg>
                        {registration.event.location}
                      </div>
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                        {formatPrice(registration.event.ticketPrice)}
                      </div>
                    </div>

                    {registration.checkInTime && (
                      <div className="mt-2 text-sm text-green-600">
                        ✓ Checked in on {new Date(registration.checkInTime).toLocaleDateString()}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 md:w-48">
                    <Link
                      href={`/registrations/${registration.id}/confirmation`}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-center text-sm"
                    >
                      View Ticket
                    </Link>
                    <Link
                      href={`/events/${registration.event.id}`}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-center text-sm"
                    >
                      Event Details
                    </Link>
                    {canCancel && (
                      <button
                        onClick={() => handleCancelRegistration(registration.id)}
                        className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 text-sm"
                      >
                        Cancel Registration
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}