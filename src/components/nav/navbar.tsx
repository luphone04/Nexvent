"use client"

import { useSession, signOut } from "next-auth/react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useState } from "react"

export function Navbar() {
  const { data: session, status } = useSession()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleSignOut = () => {
    signOut({ callbackUrl: "/" })
  }

  const closeMobileMenu = () => {
    setMobileMenuOpen(false)
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

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
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
                <Button variant="outline" size="sm" asChild>
                  <Link href="/dashboard">Dashboard</Link>
                </Button>

                <Button variant="outline" size="sm" asChild>
                  <Link href="/events">Events</Link>
                </Button>

                <Button variant="outline" size="sm" asChild>
                  <Link href="/registrations">My Registrations</Link>
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

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-gray-900 hover:text-gray-600 focus:outline-none"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            {status === "loading" ? (
              <div className="px-4">Loading...</div>
            ) : session ? (
              <div className="space-y-3 px-4">
                <div className="text-sm text-gray-600">
                  Hello, {session.user?.name}
                </div>
                <div className="text-xs bg-gray-100 px-2 py-1 rounded inline-block">
                  {session.user?.role as string}
                </div>
                
                {/* Role-based navigation */}
                <Link
                  href="/dashboard"
                  className="block py-2 text-gray-900 hover:text-gray-600"
                  onClick={closeMobileMenu}
                >
                  Dashboard
                </Link>

                <Link
                  href="/events"
                  className="block py-2 text-gray-900 hover:text-gray-600"
                  onClick={closeMobileMenu}
                >
                  Events
                </Link>

                <Link
                  href="/registrations"
                  className="block py-2 text-gray-900 hover:text-gray-600"
                  onClick={closeMobileMenu}
                >
                  My Registrations
                </Link>

                <Link
                  href="/profile"
                  className="block py-2 text-gray-900 hover:text-gray-600"
                  onClick={closeMobileMenu}
                >
                  Profile
                </Link>
                
                <button
                  onClick={() => {
                    handleSignOut()
                    closeMobileMenu()
                  }}
                  className="block py-2 text-gray-900 hover:text-gray-600 text-left"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="space-y-3 px-4">
                <Link
                  href="/auth/signin"
                  className="block py-2 text-gray-900 hover:text-gray-600"
                  onClick={closeMobileMenu}
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/signup"
                  className="block py-2 text-gray-900 hover:text-gray-600"
                  onClick={closeMobileMenu}
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}