"use client"

import { useSession, signOut } from "next-auth/react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export function Navbar() {
  const { data: session, status } = useSession()

  const handleSignOut = () => {
    signOut({ callbackUrl: "/" })
  }

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold text-gray-900">
              Nexvent
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            {status === "loading" ? (
              <div>Loading...</div>
            ) : session ? (
              <>
                <span className="text-sm text-gray-600">
                  Hello, {session.user?.name}
                </span>
                <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                  {session.user?.role as string}
                </span>
                
                {/* Role-based navigation */}
                {["ORGANIZER", "ADMIN"].includes(session.user?.role as string) && (
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/dashboard">Dashboard</Link>
                  </Button>
                )}
                
                <Button variant="outline" size="sm" asChild>
                  <Link href="/events">Events</Link>
                </Button>
                
                <Button variant="outline" size="sm" asChild>
                  <Link href="/profile">Profile</Link>
                </Button>
                
                <Button variant="outline" size="sm" onClick={handleSignOut}>
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/auth/signin">Sign In</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href="/auth/signup">Sign Up</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}