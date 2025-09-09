import { AppLayout } from "@/components/layout/app-layout"

export default function DashboardPage() {
  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Manage your events and view analytics (Organizer/Admin only).
          </p>
        </div>

        {/* Dashboard content will be loaded here */}
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
          <p>Dashboard will be implemented in the next phase.</p>
        </div>
      </div>
    </AppLayout>
  )
}