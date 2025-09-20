"use client"

import { useSession } from 'next-auth/react'
import { LoadingPage } from '@/components/ui/loading'
import { ErrorMessage } from '@/components/ui/error-boundary'
import { AttendeeDashboard } from './attendee-dashboard'
import { OrganizerDashboard } from './organizer-dashboard'
import { AdminDashboard } from './admin-dashboard'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export function DashboardContainer() {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return <LoadingPage />
  }

  if (!session) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Access Required</h1>
          <p className="text-gray-600 mb-8">Please sign in to access your dashboard.</p>
          <Button asChild>
            <Link href="/auth/signin">Sign In</Link>
          </Button>
        </div>
      </div>
    )
  }

  const userRole = session.user?.role as string

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {session.user?.name}!
          </h1>
          <p className="mt-2 text-gray-600">
            {userRole === 'ADMIN'
              ? 'Manage your platform and monitor all activities.'
              : userRole === 'ORGANIZER'
              ? 'Manage your events and track performance.'
              : 'View your registrations and discover new events.'
            }
          </p>
        </div>

        {/* Role-based Dashboard Content */}
        {userRole === 'ADMIN' ? (
          <AdminDashboard />
        ) : userRole === 'ORGANIZER' ? (
          <OrganizerDashboard />
        ) : (
          <AttendeeDashboard />
        )}
      </div>
    </div>
  )
}