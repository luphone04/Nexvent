"use client"

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { LoadingCard } from '@/components/ui/loading'
import { ErrorMessage } from '@/components/ui/error-boundary'

interface PlatformStats {
  totalUsers: number
  totalEvents: number
  totalRegistrations: number
  activeUsers: number
  eventsThisMonth: number
  registrationsThisMonth: number
}

interface RecentUser {
  id: string
  name: string
  email: string
  role: string
  createdAt: string
}

interface RecentEvent {
  id: string
  title: string
  eventDate: string
  status: string
  organizer: {
    name: string
  }
  _count: {
    registrations: number
  }
}

export function AdminDashboard() {
  const { data: session } = useSession()
  const [stats, setStats] = useState<PlatformStats>({
    totalUsers: 0,
    totalEvents: 0,
    totalRegistrations: 0,
    activeUsers: 0,
    eventsThisMonth: 0,
    registrationsThisMonth: 0
  })
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([])
  const [recentEvents, setRecentEvents] = useState<RecentEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        // Fetch platform statistics
        const statsResponse = await fetch('/api/admin/stats')
        if (statsResponse.ok) {
          const statsData = await statsResponse.json()
          const data = statsData.data

          setStats({
            totalUsers: data.overview.totalUsers || 0,
            totalEvents: data.overview.totalEvents || 0,
            totalRegistrations: data.overview.totalRegistrations || 0,
            activeUsers: 0, // We don't track this yet
            eventsThisMonth: 0, // We don't track this yet
            registrationsThisMonth: 0 // We don't track this yet
          })

          setRecentUsers(data.recent.users || [])
          setRecentEvents(data.recent.events || [])
        }
      } catch (err) {
        setError('Unable to load admin dashboard data')
      } finally {
        setLoading(false)
      }
    }

    if (session?.user?.role === 'ADMIN') {
      fetchAdminData()
    }
  }, [session])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getRoleBadge = (role: string) => {
    const roleColors = {
      ADMIN: 'bg-red-100 text-red-800',
      ORGANIZER: 'bg-blue-100 text-blue-800',
      ATTENDEE: 'bg-green-100 text-green-800'
    }

    return (
      <span className={`px-2 py-1 text-xs rounded-full ${roleColors[role as keyof typeof roleColors] || 'bg-gray-100 text-gray-800'}`}>
        {role}
      </span>
    )
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
      {/* Platform Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Total Users</dt>
                <dd className="text-lg font-medium text-gray-900">{stats.totalUsers}</dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0h6m-6 0l-6 4v10a2 2 0 002 2h12a2 2 0 002-2V11l-6-4z" />
              </svg>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Total Events</dt>
                <dd className="text-lg font-medium text-gray-900">{stats.totalEvents}</dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-8 w-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Total Registrations</dt>
                <dd className="text-lg font-medium text-gray-900">{stats.totalRegistrations}</dd>
              </dl>
            </div>
          </div>
        </div>

      </div>


      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Users */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900">Recent Users</h2>
              <Button variant="outline" size="sm" asChild>
                <Link href="/admin/users">View All</Link>
              </Button>
            </div>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => <LoadingCard key={i} />)}
              </div>
            ) : recentUsers.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No recent users</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{user.name}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                        <p className="text-xs text-gray-400">Joined {formatDate(user.createdAt)}</p>
                      </div>
                    </div>
                    {getRoleBadge(user.role)}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Events */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900">Recent Events</h2>
              <Button variant="outline" size="sm" asChild>
                <Link href="/admin/events">View All</Link>
              </Button>
            </div>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => <LoadingCard key={i} />)}
              </div>
            ) : recentEvents.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No recent events</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentEvents.map((event) => (
                  <div key={event.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div>
                      <div className="flex items-center space-x-2">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {event.title}
                        </p>
                        {getStatusBadge(event.status)}
                      </div>
                      <p className="text-sm text-gray-500">
                        by {event.organizer.name} • {formatDate(event.eventDate)}
                      </p>
                      <p className="text-xs text-blue-600">
                        {event._count.registrations} registrations
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}