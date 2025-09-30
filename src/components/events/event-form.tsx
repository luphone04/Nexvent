'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface EventFormProps {
  eventId?: string
  initialData?: {
    title: string
    description: string
    eventDate: string
    eventTime: string
    location: string
    category: string
    capacity: number
    ticketPrice: number
    imageUrl?: string
  }
}

const categories = [
  'CONFERENCE',
  'WORKSHOP',
  'SEMINAR',
  'SOCIAL',
  'SPORTS',
  'CONCERT',
  'MEETUP',
  'TRAINING'
]

export function EventForm({ eventId, initialData }: EventFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    eventDate: initialData?.eventDate || '',
    eventTime: initialData?.eventTime || '',
    location: initialData?.location || '',
    category: initialData?.category || 'CONFERENCE',
    capacity: initialData?.capacity || 50,
    ticketPrice: initialData?.ticketPrice || 0,
    imageUrl: initialData?.imageUrl || '',
  })

  const handleChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const url = eventId ? `/api/events/${eventId}` : '/api/events'
      const method = eventId ? 'PUT' : 'POST'

      // Convert date to ISO format
      const eventDateTime = new Date(`${formData.eventDate}T${formData.eventTime || '00:00'}:00.000Z`)

      const payload = {
        ...formData,
        eventDate: eventDateTime.toISOString(),
        imageUrl: formData.imageUrl || undefined, // Don't send empty string
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save event')
      }

      router.push(`/events/${data.data.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save event')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-2">Event Title *</label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => handleChange('title', e.target.value)}
          required
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="e.g., Annual Tech Conference 2025"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Description *</label>
        <textarea
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          required
          rows={5}
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Describe your event..."
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Event Date *</label>
          <input
            type="date"
            value={formData.eventDate}
            onChange={(e) => handleChange('eventDate', e.target.value)}
            required
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Event Time</label>
          <input
            type="time"
            value={formData.eventTime}
            onChange={(e) => handleChange('eventTime', e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Location *</label>
        <input
          type="text"
          value={formData.location}
          onChange={(e) => handleChange('location', e.target.value)}
          required
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="e.g., Convention Center, 123 Main St, San Francisco"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Category *</label>
          <select
            value={formData.category}
            onChange={(e) => handleChange('category', e.target.value)}
            required
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Capacity *</label>
          <input
            type="number"
            value={formData.capacity}
            onChange={(e) => handleChange('capacity', e.target.value === '' ? 1 : parseInt(e.target.value))}
            required
            min="1"
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Ticket Price ($)</label>
          <input
            type="number"
            value={formData.ticketPrice}
            onChange={(e) => handleChange('ticketPrice', e.target.value === '' ? 0 : parseFloat(e.target.value))}
            min="0"
            step="0.01"
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="0 for free events"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Image URL (Optional)</label>
          <input
            type="url"
            value={formData.imageUrl}
            onChange={(e) => handleChange('imageUrl', e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="https://example.com/image.jpg"
          />
        </div>
      </div>

      <div className="flex gap-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2 border rounded-lg hover:bg-gray-50"
          disabled={isLoading}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? 'Saving...' : eventId ? 'Update Event' : 'Create Event'}
        </button>
      </div>
    </form>
  )
}