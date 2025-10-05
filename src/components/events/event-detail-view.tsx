"use client"

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { LoadingPage } from '@/components/ui/loading'
import { ErrorMessage } from '@/components/ui/error-boundary'
import { RelatedEvents } from '@/components/events/related-events'
import { SocialShare } from '@/components/events/social-share'
import { apiClient } from '@/lib/utils/api-client'

interface Event {
  id: string
  title: string
  description: string
  eventDate: string
  eventTime?: string
  location: string
  category: string
  ticketPrice?: number | string
  imageUrl?: string
  capacity?: number
  status: string
  organizer: {
    id: string
    name: string
    email: string
    organization?: string
  }
  _count: {
    registrations: number
  }
}

interface EventDetailViewProps {
  eventId: string
}

export function EventDetailView({ eventId }: EventDetailViewProps) {
  const { data: session } = useSession()
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [userRegistration, setUserRegistration] = useState<any>(null)

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const response = await apiClient.get(`/api/events/${eventId}`)
        if (!response.ok) {
          throw new Error('Event not found')
        }
        const data = await response.json()
        setEvent(data.data)
      } catch (err) {
        setError('Unable to load event details')
      } finally {
        setLoading(false)
      }
    }

    if (eventId) {
      fetchEvent()
    }
  }, [eventId])

  // Check if user is already registered
  useEffect(() => {
    const checkRegistration = async () => {
      if (!session) return

      try {
        const response = await apiClient.get(`/api/registrations?eventId=${eventId}`)
        if (response.ok) {
          const data = await response.json()
          // Find active registration for this event (not CANCELLED)
          const registration = data.data.find((reg: any) =>
            reg.event.id === eventId &&
            (reg.status === 'REGISTERED' || reg.status === 'WAITLISTED' || reg.status === 'ATTENDED')
          )
          setUserRegistration(registration || null)
        }
      } catch {
        // Ignore errors - user just not registered
      }
    }

    if (eventId && session) {
      checkRegistration()
    }
  }, [eventId, session])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatPrice = (price?: number | string) => {
    if (!price || price === 0) return 'Free'
    const numPrice = typeof price === 'string' ? parseFloat(price) : price
    if (isNaN(numPrice)) return 'Free'
    return `$${numPrice.toFixed(2)}`
  }

  const handleRegister = () => {
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''
    if (!session) {
      // Redirect to login with callback to registration page
      window.location.href = `${basePath}/auth/signin?callbackUrl=/events/${eventId}/register`
      return
    }

    // Redirect to registration form
    window.location.href = `${basePath}/events/${eventId}/register`
  }

  const handleStatusToggle = async () => {
    if (!event) return

    const newStatus = event.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED'
    const confirmMsg = newStatus === 'PUBLISHED'
      ? 'Publish this event? It will become visible to all users.'
      : 'Unpublish this event? It will no longer be visible to users.'

    if (!confirm(confirmMsg)) return

    try {
      const updateData: any = {
        status: newStatus,
        title: event.title,
        description: event.description,
        eventDate: event.eventDate,
        eventTime: event.eventTime,
        location: event.location,
        capacity: event.capacity,
        category: event.category,
        ticketPrice: typeof event.ticketPrice === 'string' ? parseFloat(event.ticketPrice) : event.ticketPrice,
      }

      // Only include imageUrl if it exists and is not empty
      if (event.imageUrl) {
        updateData.imageUrl = event.imageUrl
      }

      const response = await apiClient.put(`/api/events/${eventId}`, updateData)

      if (response.ok) {
        window.location.reload()
      } else {
        alert('Failed to update event status')
      }
    } catch {
      alert('Failed to update event status')
    }
  }

  const getCapacityStatus = () => {
    if (!event?.capacity) return null

    const registrationCount = event._count.registrations
    const capacity = event.capacity
    const percentage = (registrationCount / capacity) * 100

    if (percentage >= 100) {
      return { status: 'full', text: 'Event Full', color: 'text-red-600 bg-red-100' }
    } else if (percentage >= 80) {
      return { status: 'almost-full', text: 'Almost Full', color: 'text-orange-600 bg-orange-100' }
    } else {
      return { status: 'available', text: 'Spots Available', color: 'text-green-600 bg-green-100' }
    }
  }

  if (loading) {
    return <LoadingPage />
  }

  if (error || !event) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ErrorMessage message={error || 'Event not found'} />
        <div className="mt-8 text-center">
          <Button asChild variant="outline">
            <Link href="/events">Back to Events</Link>
          </Button>
        </div>
      </div>
    )
  }

  const capacityStatus = getCapacityStatus()
  const eventPassed = new Date(event.eventDate) < new Date()
  const canRegister = !eventPassed && event.status === 'PUBLISHED' &&
                     (!event.capacity || event._count.registrations < event.capacity) &&
                     !userRegistration  // Can't register if already registered

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-8">
          {event.imageUrl ? (
            <div className="h-64 md:h-96 w-full">
              <img
                src={event.imageUrl}
                alt={event.title}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="h-64 md:h-96 w-full bg-gradient-to-r from-blue-100 to-purple-100 flex items-center justify-center">
              <svg className="w-24 h-24 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0h6m-6 0l-6 4v10a2 2 0 002 2h12a2 2 0 002-2V11l-6-4z" />
              </svg>
            </div>
          )}

          <div className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
              <div className="flex-1">
                <div className="mb-4">
                  <span className="inline-block bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full">
                    {event.category}
                  </span>
                  {capacityStatus && (
                    <span className={`ml-2 inline-block text-sm px-3 py-1 rounded-full ${capacityStatus.color}`}>
                      {capacityStatus.text}
                    </span>
                  )}
                </div>

                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                  {event.title}
                </h1>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-600 mb-6">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0V9a2 2 0 012-2h4a2 2 0 012 2v4M6 7h12a2 2 0 012 2v8a2 2 0 01-2 2H6a2 2 0 01-2-2V9a2 2 0 012-2z" />
                    </svg>
                    <div>
                      <div className="font-medium">{formatDate(event.eventDate)}</div>
                      {event.eventTime && <div className="text-sm">at {event.eventTime}</div>}
                    </div>
                  </div>

                  <div className="flex items-center">
                    <svg className="w-5 h-5 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <div className="font-medium">{event.location}</div>
                  </div>

                  <div className="flex items-center">
                    <svg className="w-5 h-5 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                    <div className="text-lg font-semibold text-green-600">
                      {formatPrice(event.ticketPrice)}
                    </div>
                  </div>

                  <div className="flex items-center">
                    <svg className="w-5 h-5 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                    <div>
                      <span className="font-medium">{event._count.registrations}</span>
                      {event.capacity && <span> / {event.capacity}</span>}
                      <span className="text-sm ml-1">registered</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Registration Section - Hide for organizers */}
              <div className="flex-shrink-0 md:w-64 space-y-3">
                {session?.user?.id === event.organizer.id ? (
                  // Don't show registration status for organizers
                  null
                ) : userRegistration ? (
                  <div className="space-y-2">
                    <div className="text-center p-4 bg-green-100 rounded-lg border-2 border-green-500">
                      <span className="text-green-800 font-semibold">✓ Already Registered</span>
                      <p className="text-sm text-green-700 mt-1">Status: {userRegistration.status}</p>
                    </div>
                    <Link href={`/registrations/${userRegistration.id}/confirmation`}>
                      <Button variant="outline" className="w-full">
                        View Registration
                      </Button>
                    </Link>
                  </div>
                ) : canRegister ? (
                  <Button
                    onClick={handleRegister}
                    className="w-full text-lg py-3"
                    size="lg"
                  >
                    Register Now
                  </Button>
                ) : eventPassed ? (
                  <div className="text-center p-4 bg-gray-100 rounded-lg">
                    <span className="text-gray-600">Event has ended</span>
                  </div>
                ) : event.status !== 'PUBLISHED' ? (
                  <div className="text-center p-4 bg-yellow-100 rounded-lg">
                    <span className="text-yellow-800">Event not yet published</span>
                  </div>
                ) : (
                  <div className="text-center p-4 bg-red-100 rounded-lg">
                    <span className="text-red-800">Registration full</span>
                  </div>
                )}

                {!session && canRegister && (
                  <p className="text-sm text-gray-600 text-center">
                    <Link href="/auth/signin" className="text-blue-600 hover:underline">
                      Sign in
                    </Link> to register
                  </p>
                )}

                {/* Organizer Actions */}
                {session?.user?.id === event.organizer.id && (
                  <div className="space-y-2">
                    <Link href={`/events/${event.id}/attendees`} className="block">
                      <Button className="w-full">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                        View Attendees
                      </Button>
                    </Link>
                    <Link href={`/events/${event.id}/check-in`} className="block">
                      <Button variant="outline" className="w-full">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                        </svg>
                        Check-In Attendees
                      </Button>
                    </Link>
                    <Button
                      onClick={handleStatusToggle}
                      variant="outline"
                      className="w-full"
                    >
                      {event.status === 'PUBLISHED' ? 'Unpublish Event' : 'Publish Event'}
                    </Button>
                    <Link href={`/events/${event.id}/edit`} className="block">
                      <Button variant="outline" className="w-full">
                        Edit Event
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">About This Event</h2>
              <div className="prose max-w-none">
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {event.description}
                </p>
              </div>
            </div>

            {/* Social Share */}
            <SocialShare event={event} />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Organizer Info */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Event Organizer</h3>
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">{event.organizer.name}</h4>
                  {event.organizer.organization && (
                    <p className="text-sm text-gray-600">{event.organizer.organization}</p>
                  )}
                  <p className="text-sm text-gray-600">{event.organizer.email}</p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href="/events">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Back to Events
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href={`/events?category=${event.category}`}>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    More {event.category} Events
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Related Events */}
        <RelatedEvents currentEventId={eventId} category={event.category} />
      </div>
    </div>
  )
}