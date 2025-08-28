import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authConfig } from "./config"
import { UserRole } from "@prisma/client"

export async function getCurrentUser() {
  const session = await getServerSession(authConfig)
  return session?.user
}

export async function requireAuth() {
  const session = await getServerSession(authConfig)
  if (!session?.user) {
    redirect("/auth/signin")
  }
  return session.user
}

export async function requireRole(allowedRoles: UserRole[]) {
  const session = await getServerSession(authConfig)
  
  if (!session?.user) {
    redirect("/auth/signin")
  }

  const userRole = (session.user as any).role as UserRole
  
  if (!allowedRoles.includes(userRole)) {
    redirect("/unauthorized")
  }
  
  return session.user
}

export async function requireOrganizer() {
  return await requireRole([UserRole.ORGANIZER, UserRole.ADMIN])
}

export async function requireAdmin() {
  return await requireRole([UserRole.ADMIN])
}