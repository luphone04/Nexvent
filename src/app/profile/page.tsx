import { ProfileForm } from '@/components/profile-form'
import { AppLayout } from "@/components/layout/app-layout"

export default function ProfilePage() {
  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
          <p className="mt-2 text-gray-600">
            Manage your account settings and view your event history.
          </p>
        </div>

        <ProfileForm />
      </div>
    </AppLayout>
  )
}