'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { QRCodeDisplay } from '@/components/qr-code/qr-code-display'
import { apiClient } from '@/lib/utils/api-client'

interface Registration {
  id: string
  status: string
  registrationDate: string
  checkInCode: string
  specialRequirements?: string | null
  event: {
    id: string
    title: string
    eventDate: string
    eventTime: string | null
    location: string
    category: string
  }
  attendee: {
    name: string
    email: string
  }
}

interface RegistrationConfirmationProps {
  registrationId: string
}

export function RegistrationConfirmation({ registrationId }: RegistrationConfirmationProps) {
  const router = useRouter()
  const [registration, setRegistration] = useState<Registration | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isCancelling, setIsCancelling] = useState(false)

  useEffect(() => {
    const fetchRegistration = async () => {
      try {
        const response = await apiClient.get(`/api/registrations/${registrationId}`)
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to load registration')
        }

        setRegistration(data.data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load registration')
      } finally {
        setIsLoading(false)
      }
    }

    fetchRegistration()
  }, [registrationId])

  const handleCancelRegistration = async () => {
    if (!confirm('Are you sure you want to cancel this registration? This action cannot be undone.')) {
      return
    }

    setIsCancelling(true)
    try {
      const response = await apiClient.delete(`/api/registrations/${registrationId}`)

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to cancel registration')
      }

      alert('Registration cancelled successfully')
      router.push('/registrations')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to cancel registration')
      setIsCancelling(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your registration...</p>
        </div>
      </div>
    )
  }

  if (error || !registration) {
    return (
      <div className="max-w-2xl mx-auto mt-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h2 className="text-xl font-bold text-red-700 mb-2">Error</h2>
          <p className="text-red-600 mb-4">{error || 'Registration not found'}</p>
          <Link
            href="/events"
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Browse Events
          </Link>
        </div>
      </div>
    )
  }

  const isWaitlisted = registration.status === 'WAITLISTED'
  const eventPassed = new Date(registration.event.eventDate) < new Date()
  const canCancel = !eventPassed && registration.status === 'REGISTERED'

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Success Message */}
      <div className={`rounded-lg p-6 mb-8 text-center ${
        isWaitlisted ? 'bg-yellow-50 border border-yellow-200' : 'bg-green-50 border border-green-200'
      }`}>
        <div className="text-4xl mb-4">{isWaitlisted ? '⏳' : '✅'}</div>
        <h1 className={`text-2xl font-bold mb-2 ${
          isWaitlisted ? 'text-yellow-800' : 'text-green-800'
        }`}>
          {isWaitlisted ? 'Added to Waitlist!' : 'Registration Confirmed!'}
        </h1>
        <p className={isWaitlisted ? 'text-yellow-700' : 'text-green-700'}>
          {isWaitlisted
            ? 'You have been added to the waitlist. We will notify you if a spot becomes available.'
            : 'Your registration has been confirmed. See you at the event!'}
        </p>
      </div>

      {/* Registration Details */}
      <div className="bg-white rounded-lg border p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">Event Details</h2>

        <div className="space-y-3">
          <div>
            <span className="font-semibold">Event:</span>
            <p className="text-lg">{registration.event.title}</p>
          </div>

          <div>
            <span className="font-semibold">Date & Time:</span>
            <p>
              {new Date(registration.event.eventDate).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
              {registration.event.eventTime && ` at ${registration.event.eventTime}`}
            </p>
          </div>

          <div>
            <span className="font-semibold">Location:</span>
            <p>{registration.event.location}</p>
          </div>

          <div>
            <span className="font-semibold">Category:</span>
            <p className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
              {registration.event.category}
            </p>
          </div>

          <div>
            <span className="font-semibold">Registered On:</span>
            <p>
              {new Date(registration.registrationDate).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>

          <div>
            <span className="font-semibold">Status:</span>
            <p className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
              registration.status === 'REGISTERED'
                ? 'bg-green-100 text-green-800'
                : registration.status === 'WAITLISTED'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-gray-100 text-gray-800'
            }`}>
              {registration.status}
            </p>
          </div>
        </div>

        {registration.specialRequirements && (
          <div className="mt-4 pt-4 border-t">
            <h3 className="font-semibold mb-2">Additional Information</h3>
            <div>
              <span className="text-sm text-gray-600">Special Requirements:</span>
              <p className="text-sm">{registration.specialRequirements}</p>
            </div>
          </div>
        )}
      </div>

      {/* QR Code Section - Only show if registered (not waitlisted) */}
      {!isWaitlisted && (
        <div className="bg-white rounded-lg border p-6 mb-6">
          <h2 className="text-xl font-bold mb-4 text-center">Your Event Ticket</h2>

          <div className="flex flex-col items-center">
            <p className="text-center text-gray-600 mb-4">
              <span className="font-semibold">Check-in Code:</span> {registration.checkInCode}
            </p>

            <QRCodeDisplay
              data={{
                registrationId: registration.id,
                checkInCode: registration.checkInCode,
                eventId: registration.event.id,
              }}
              size={300}
              filename={`event-ticket-${registrationId}.png`}
              showDownload={true}
            />

            <p className="text-sm text-gray-500 text-center mt-4 max-w-md">
              Present this QR code at the event entrance for check-in. You can download it or save this page for offline access.
            </p>
          </div>
        </div>
      )}

      {/* Next Steps */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
        <h3 className="font-semibold mb-3">What&apos;s Next?</h3>
        <ul className="space-y-2 text-sm list-disc list-inside">
          <li>A confirmation email has been sent to {registration.attendee.email}</li>
          {!isWaitlisted && (
            <>
              <li>Save your QR code for easy access at the event</li>
              <li>Add the event to your calendar</li>
            </>
          )}
          <li>You will receive a reminder email before the event</li>
        </ul>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          href="/dashboard"
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-center"
        >
          Go to Dashboard
        </Link>
        <Link
          href="/events"
          className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 text-center"
        >
          Browse More Events
        </Link>
        {canCancel && (
          <button
            onClick={handleCancelRegistration}
            disabled={isCancelling}
            className="px-6 py-3 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 text-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCancelling ? 'Cancelling...' : 'Cancel Registration'}
          </button>
        )}
      </div>

      {/* Print Styles */}
      <style jsx>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .bg-white.rounded-lg.border {
            visibility: visible;
            position: absolute;
            left: 0;
            top: 0;
          }
        }
      `}</style>
    </div>
  )
}