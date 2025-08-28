import { prisma } from "@/lib/db"
import { UserRole } from "@prisma/client"
import bcrypt from "bcryptjs"

export async function ensureAdminExists() {
  try {
    // Check if any admin users exist
    const adminCount = await prisma.user.count({
      where: {
        role: UserRole.ADMIN
      }
    })

    if (adminCount === 0) {
      console.log("No admin users found. Creating default admin...")
      
      // Create a default admin user
      const hashedPassword = await bcrypt.hash("admin123", 12)
      
      const adminUser = await prisma.user.create({
        data: {
          name: "System Administrator",
          email: "admin@nexvent.local",
          password: hashedPassword,
          role: UserRole.ADMIN,
        }
      })

      console.log(`Created default admin user: ${adminUser.email}`)
      console.log("Default password: admin123 (Please change this in production!)")
      
      return adminUser
    }

    return null
  } catch (error) {
    console.error("Error ensuring admin exists:", error)
    throw error
  }
}

export async function getUserStats() {
  const stats = await prisma.user.groupBy({
    by: ['role'],
    _count: {
      role: true
    }
  })
  
  return stats.reduce((acc, stat) => {
    acc[stat.role] = stat._count.role
    return acc
  }, {} as Record<string, number>)
}