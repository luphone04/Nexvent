import { AppLayout } from "@/components/layout/app-layout"
import { EventsListing } from "@/components/events/events-listing"

export default function EventsPage() {
  return (
    <AppLayout>
      <div className="bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">All Events</h1>
            <p className="mt-2 text-gray-600">
              Discover and register for amazing events happening near you.
            </p>
          </div>

          <EventsListing />
        </div>
      </div>
    </AppLayout>
  )
}