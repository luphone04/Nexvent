"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { LoadingCard } from '@/components/ui/loading'

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
  _count: {
    registrations: number
  }
  capacity?: number
}

interface RelatedEventsProps {
  currentEventId: string
  category: string
}

export function RelatedEvents({ currentEventId, category }: RelatedEventsProps) {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRelatedEvents = async () => {
      try {
        const response = await fetch(`/api/events?category=${category}&limit=4`)
        if (response.ok) {
          const data = await response.json()
          // Filter out the current event and limit to 3 related events
          const relatedEvents = (data.data || [])
            .filter((event: Event) => event.id !== currentEventId)
            .slice(0, 3)
          setEvents(relatedEvents)
        }
      } catch (err) {
        console.error('Failed to fetch related events:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchRelatedEvents()
  }, [currentEventId, category])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatPrice = (price?: number | string) => {
    if (!price || price === 0) return 'Free'
    const numPrice = typeof price === 'string' ? parseFloat(price) : price
    if (isNaN(numPrice)) return 'Free'
    return `$${numPrice.toFixed(2)}`
  }

  if (loading) {
    return (
      <div className="mt-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Related Events</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <LoadingCard key={i} />
          ))}
        </div>
      </div>
    )
  }

  if (events.length === 0) {
    return null
  }

  return (
    <div className="mt-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Related Events</h2>
        <Button variant="outline" asChild>
          <Link href={`/events?category=${category}`}>
            View All {category} Events
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map((event) => (
          <div key={event.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
            {event.imageUrl ? (
              <img
                src={event.imageUrl}
                alt={event.title}
                className="w-full h-48 object-cover"
              />
            ) : (
              <div className="w-full h-48 bg-gradient-to-r from-blue-100 to-purple-100 flex items-center justify-center">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0h6m-6 0l-6 4v10a2 2 0 002 2h12a2 2 0 002-2V11l-6-4z" />
                </svg>
              </div>
            )}

            <div className="p-6">
              <div className="mb-2">
                <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                  {event.category}
                </span>
              </div>

              <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                {event.title}
              </h3>

              <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                {event.description}
              </p>

              <div className="space-y-2 text-sm text-gray-500">
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0V9a2 2 0 012-2h4a2 2 0 012 2v4M6 7h12a2 2 0 012 2v8a2 2 0 01-2 2H6a2 2 0 01-2-2V9a2 2 0 012-2z" />
                  </svg>
                  <span>{formatDate(event.eventDate)}</span>
                  {event.eventTime && <span className="ml-1">at {event.eventTime}</span>}
                </div>

                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="truncate">{event.location}</span>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="font-medium text-green-600">
                    {formatPrice(event.ticketPrice)}
                  </span>
                  <span className="text-xs">
                    {event._count.registrations} registered
                    {event.capacity && ` / ${event.capacity}`}
                  </span>
                </div>
              </div>

              <div className="mt-4">
                <Button asChild className="w-full" size="sm">
                  <Link href={`/events/${event.id}`}>
                    View Details
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}