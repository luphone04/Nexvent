'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { apiClient } from '@/lib/utils/api-client'

interface Event {
  id: string
  title: string
  eventDate: Date
  eventTime: string | null
  location: string
  ticketPrice: number | string
  capacity: number
  category: string
  _count?: {
    registrations: number
  }
}

interface RegistrationFormProps {
  event: Event
}

type RegistrationStep = 1 | 2 | 3

interface FormData {
  specialRequirements: string
  dietaryRestrictions: string
  emergencyContact: string
  emergencyPhone: string
}

export function RegistrationForm({ event }: RegistrationFormProps) {
  const router = useRouter()
  const { data: session } = useSession()
  const [currentStep, setCurrentStep] = useState<RegistrationStep>(1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState<FormData>({
    specialRequirements: '',
    dietaryRestrictions: '',
    emergencyContact: '',
    emergencyPhone: '',
  })

  const registrationCount = event._count?.registrations || 0
  const spotsRemaining = event.capacity - registrationCount
  const isFull = spotsRemaining <= 0

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep((currentStep + 1) as RegistrationStep)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as RegistrationStep)
    }
  }

  const handleSubmit = async () => {
    if (!session?.user?.id) {
      setError('You must be logged in to register')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Combine all special requirements into one field
      const requirements = []
      if (formData.specialRequirements) requirements.push(`Special Requirements: ${formData.specialRequirements}`)
      if (formData.dietaryRestrictions) requirements.push(`Dietary: ${formData.dietaryRestrictions}`)
      if (formData.emergencyContact) requirements.push(`Emergency Contact: ${formData.emergencyContact}`)
      if (formData.emergencyPhone) requirements.push(`Emergency Phone: ${formData.emergencyPhone}`)

      const response = await apiClient.post('/api/registrations', {
        eventId: event.id,
        attendeeId: session.user.id,
        specialRequirements: requirements.length > 0 ? requirements.join(' | ') : null,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed')
      }

      // Redirect to confirmation page
      router.push(`/registrations/${data.data.id}/confirmation`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setIsLoading(false)
    }
  }

  const ticketPrice = typeof event.ticketPrice === 'string'
    ? parseFloat(event.ticketPrice)
    : event.ticketPrice

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className={`flex-1 ${currentStep >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200'
              }`}>
                1
              </div>
              <div className="ml-2 text-sm font-medium">Details</div>
            </div>
          </div>
          <div className={`flex-1 h-1 mx-2 ${currentStep >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`} />
          <div className={`flex-1 ${currentStep >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200'
              }`}>
                2
              </div>
              <div className="ml-2 text-sm font-medium">Review</div>
            </div>
          </div>
          <div className={`flex-1 h-1 mx-2 ${currentStep >= 3 ? 'bg-blue-600' : 'bg-gray-200'}`} />
          <div className={`flex-1 ${currentStep >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200'
              }`}>
                3
              </div>
              <div className="ml-2 text-sm font-medium">Confirm</div>
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Step 1: Registration Details */}
      {currentStep === 1 && (
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-xl font-bold mb-6">Registration Details</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Special Requirements (Optional)
              </label>
              <textarea
                value={formData.specialRequirements}
                onChange={(e) => handleInputChange('specialRequirements', e.target.value)}
                placeholder="Any special accommodations you need..."
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Dietary Restrictions (Optional)
              </label>
              <input
                type="text"
                value={formData.dietaryRestrictions}
                onChange={(e) => handleInputChange('dietaryRestrictions', e.target.value)}
                placeholder="e.g., Vegetarian, Vegan, Gluten-free..."
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Emergency Contact Name (Optional)
              </label>
              <input
                type="text"
                value={formData.emergencyContact}
                onChange={(e) => handleInputChange('emergencyContact', e.target.value)}
                placeholder="Contact person name..."
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Emergency Contact Phone (Optional)
              </label>
              <input
                type="tel"
                value={formData.emergencyPhone}
                onChange={(e) => handleInputChange('emergencyPhone', e.target.value)}
                placeholder="+1 (555) 123-4567"
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex justify-end mt-6">
            <button
              onClick={handleNext}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Review Information */}
      {currentStep === 2 && (
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-xl font-bold mb-6">Review Your Information</h2>

          <div className="space-y-4">
            <div className="border-b pb-4">
              <h3 className="font-semibold mb-2">Event Details</h3>
              <p className="text-lg font-medium">{event.title}</p>
              <p className="text-gray-600">
                {new Date(event.eventDate).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
                {event.eventTime && ` at ${event.eventTime}`}
              </p>
              <p className="text-gray-600">{event.location}</p>
              <p className="text-gray-900 font-semibold mt-2">
                {ticketPrice === 0 ? 'Free Event' : `$${ticketPrice.toFixed(2)}`}
              </p>
            </div>

            {formData.specialRequirements && (
              <div className="border-b pb-4">
                <h3 className="font-semibold mb-2">Special Requirements</h3>
                <p className="text-gray-700">{formData.specialRequirements}</p>
              </div>
            )}

            {formData.dietaryRestrictions && (
              <div className="border-b pb-4">
                <h3 className="font-semibold mb-2">Dietary Restrictions</h3>
                <p className="text-gray-700">{formData.dietaryRestrictions}</p>
              </div>
            )}

            {(formData.emergencyContact || formData.emergencyPhone) && (
              <div className="border-b pb-4">
                <h3 className="font-semibold mb-2">Emergency Contact</h3>
                {formData.emergencyContact && (
                  <p className="text-gray-700">Name: {formData.emergencyContact}</p>
                )}
                {formData.emergencyPhone && (
                  <p className="text-gray-700">Phone: {formData.emergencyPhone}</p>
                )}
              </div>
            )}

            {isFull && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-yellow-800">
                  <span className="font-semibold">Note:</span> This event is currently full.
                  You will be added to the waitlist.
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-between mt-6">
            <button
              onClick={handleBack}
              className="px-6 py-2 border rounded-lg hover:bg-gray-50"
            >
              Back
            </button>
            <button
              onClick={handleNext}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Confirm Registration */}
      {currentStep === 3 && (
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-xl font-bold mb-6">Confirm Registration</h2>

          <div className="mb-6">
            <p className="text-gray-700 mb-4">
              Please review and confirm your registration for <span className="font-semibold">{event.title}</span>.
            </p>

            {ticketPrice > 0 ? (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <h3 className="font-semibold mb-2">Payment Information</h3>
                <p className="text-gray-700">
                  Total Amount: <span className="text-xl font-bold">${ticketPrice.toFixed(2)}</span>
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  Payment will be processed upon confirmation.
                </p>
              </div>
            ) : (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <p className="text-green-800 font-semibold">This is a free event</p>
              </div>
            )}

            <div className="text-sm text-gray-600 space-y-1">
              <p>• You will receive a confirmation email with your QR code</p>
              <p>• Your QR code will be required for event check-in</p>
              <p>• Cancellation policy applies as per event terms</p>
            </div>
          </div>

          <div className="flex justify-between">
            <button
              onClick={handleBack}
              disabled={isLoading}
              className="px-6 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {isLoading ? 'Processing...' : 'Confirm Registration'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}