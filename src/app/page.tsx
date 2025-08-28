import Link from "next/link"
import { Navbar } from "@/components/nav/navbar"
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 sm:text-6xl">
            Welcome to <span className="text-blue-600">Nexvent</span>
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            Discover amazing events, register with ease, and manage your event participation all in one place.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Button asChild>
              <Link href="/events">Browse Events</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/auth/signup">Get Started</Link>
            </Button>
          </div>
        </div>
        
        <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-3">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900">Discover Events</h3>
            <p className="mt-2 text-gray-600">
              Browse events by category, location, and date. Find exactly what interests you.
            </p>
          </div>
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900">Easy Registration</h3>
            <p className="mt-2 text-gray-600">
              Register for events with just a few clicks. Get QR codes for easy check-in.
            </p>
          </div>
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900">Manage Events</h3>
            <p className="mt-2 text-gray-600">
              Organizers can create and manage events, track attendance, and analyze participation.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
