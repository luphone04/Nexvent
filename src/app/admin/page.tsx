import { AppLayout } from '@/components/layout/app-layout'
import { AdminDashboard } from '@/components/admin/admin-dashboard'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authConfig } from '@/lib/auth/config'

export default async function AdminPage() {
  const session = await getServerSession(authConfig)

  if (!session) {
    redirect('/auth/signin?callbackUrl=/admin')
  }

  // Only admins can access
  if (session.user.role !== 'ADMIN') {
    return (
      <AppLayout>
        <div className="max-w-2xl mx-auto mt-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <h2 className="text-xl font-bold text-red-700 mb-2">Access Denied</h2>
            <p className="text-red-600">Only administrators can access this page.</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <AdminDashboard />
    </AppLayout>
  )
}
