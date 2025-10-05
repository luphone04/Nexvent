'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { QRScanner } from '@/components/qr-code/qr-scanner'

interface Event {
  id: string
  title: string
  eventDate: string
  eventTime?: string
  location: string
}

interface CheckInViewProps {
  event: Event
}

interface CheckInResult {
  success: boolean
  message: string
  attendeeName?: string
  alreadyCheckedIn?: boolean
}

export function CheckInView({ event }: CheckInViewProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [result, setResult] = useState<CheckInResult | null>(null)
  const [checkInHistory, setCheckInHistory] = useState<Array<{
    name: string
    time: string
    alreadyCheckedIn?: boolean
  }>>([])
  const lastScannedRef = useRef<string>('')
  const lastScanTimeRef = useRef<number>(0)

  // Fetch check-in history on mount
  useEffect(() => {
    const fetchCheckInHistory = async () => {
      try {
        const response = await fetch(`/api/registrations?eventId=${event.id}&status=ATTENDED`)
        if (response.ok) {
          const data = await response.json()
          const history = data.data.map((reg: any) => ({
            name: reg.attendee.name,
            time: reg.checkInTime ? new Date(reg.checkInTime).toLocaleTimeString() : 'Unknown',
            alreadyCheckedIn: true
          }))
          setCheckInHistory(history)
        }
      } catch (error) {
        console.error('Error fetching check-in history:', error)
      }
    }

    fetchCheckInHistory()
  }, [event.id])

  const handleScanSuccess = async (decodedText: string) => {
    const now = Date.now()

    // Prevent duplicate scans: same QR code within 3 seconds
    if (isProcessing ||
        (lastScannedRef.current === decodedText && now - lastScanTimeRef.current < 3000)) {
      return
    }

    setIsProcessing(true)
    lastScannedRef.current = decodedText
    lastScanTimeRef.current = now
    setResult(null)

    try {
      const response = await fetch('/api/registrations/check-in', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          qrData: decodedText,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        // Only add to history if this is a new check-in, not if already checked in
        if (!data.data.alreadyCheckedIn) {
          const newEntry = {
            name: data.data.attendee.name,
            time: new Date().toLocaleTimeString(),
            alreadyCheckedIn: false
          }
          setCheckInHistory(prev => [newEntry, ...prev])
        }

        setResult({
          success: true,
          message: data.message,
          attendeeName: data.data.attendee.name,
          alreadyCheckedIn: data.data.alreadyCheckedIn
        })
      } else {
        setResult({
          success: false,
          message: data.error || 'Check-in failed'
        })
      }
    } catch (error) {
      setResult({
        success: false,
        message: 'Network error. Please try again.'
      })
    } finally {
      // Auto-clear result after 3 seconds
      setTimeout(() => {
        setIsProcessing(false)
        setResult(null)
      }, 3000)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link href={`/events/${event.id}`} className="text-blue-600 hover:underline mb-2 inline-block">
          ← Back to Event
        </Link>
        <h1 className="text-3xl font-bold mb-2">Event Check-In</h1>
        <div className="text-gray-600">
          <p className="text-xl">{event.title}</p>
          <p>{formatDate(event.eventDate)} {event.eventTime && `at ${event.eventTime}`}</p>
          <p>{event.location}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Scanner Section */}
        <div>
          <div className="bg-white rounded-lg border p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">Scan QR Code</h2>

            {result && (
              <div className={`mb-4 p-4 rounded-lg border-2 ${
                result.success
                  ? result.alreadyCheckedIn
                    ? 'bg-yellow-50 border-yellow-300'
                    : 'bg-green-50 border-green-300'
                  : 'bg-red-50 border-red-300'
              }`}>
                <div className="flex items-center">
                  <div className="text-3xl mr-3">
                    {result.success
                      ? result.alreadyCheckedIn ? '⚠️' : '✅'
                      : '❌'}
                  </div>
                  <div>
                    <p className={`font-bold ${
                      result.success
                        ? result.alreadyCheckedIn ? 'text-yellow-800' : 'text-green-800'
                        : 'text-red-800'
                    }`}>
                      {result.attendeeName || result.message}
                    </p>
                    {result.attendeeName && (
                      <p className={`text-sm ${
                        result.success
                          ? result.alreadyCheckedIn ? 'text-yellow-700' : 'text-green-700'
                          : 'text-red-700'
                      }`}>
                        {result.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <QRScanner
              onScanSuccess={handleScanSuccess}
              onScanError={(error) => console.error('Scanner error:', error)}
            />

            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Instructions:</strong><br />
                1. Click "Start Scanner"<br />
                2. Allow camera access<br />
                3. Point camera at attendee&apos;s QR code<br />
                4. Check-in happens automatically
              </p>
            </div>
          </div>
        </div>

        {/* Check-in History */}
        <div>
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-xl font-bold mb-4">Check-In History</h2>

            {checkInHistory.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <svg className="w-16 h-16 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p>No check-ins yet</p>
                <p className="text-sm mt-1">Start scanning QR codes to check in attendees</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {checkInHistory.map((entry, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border ${
                      entry.alreadyCheckedIn
                        ? 'bg-yellow-50 border-yellow-200'
                        : 'bg-green-50 border-green-200'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{entry.name}</p>
                        {entry.alreadyCheckedIn && (
                          <p className="text-xs text-yellow-700">Already checked in</p>
                        )}
                      </div>
                      <span className="text-sm text-gray-600">{entry.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4 pt-4 border-t">
              <div className="flex justify-between items-center text-sm">
                <span className="font-medium">Total Checked In:</span>
                <span className="text-lg font-bold text-green-600">
                  {checkInHistory.length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
