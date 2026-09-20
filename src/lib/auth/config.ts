import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/db"
import { UserRole } from "@prisma/client"

export const authConfig: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { 
          label: "Email", 
          type: "email",
          placeholder: "john@example.com"
        },
        password: { 
          label: "Password", 
          type: "password" 
        },
        name: {
          label: "Name",
          type: "text",
          placeholder: "John Doe"
        },
        role: {
          label: "Role",
          type: "text"
        },
        isSignUp: {
          label: "Is Sign Up",
          type: "hidden"
        }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required")
        }

        credentials.email = credentials.email.trim().toLowerCase()
        if (credentials.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(credentials.email) || credentials.password.length > 72) {
          throw new Error("Invalid email or password")
        }

        // Handle Sign Up
        if (credentials.isSignUp === "true") {
          if (!credentials.name) {
            throw new Error("Name is required for sign up")
          }

          if (credentials.password.length < 8 || credentials.name.trim().length > 100) {
            throw new Error("Use a password of at least 8 characters and a name under 100 characters")
          }
          // Check if user already exists
          const existingUser = await prisma.user.findUnique({
            where: { email: credentials.email }
          })

          if (existingUser) {
            throw new Error("User already exists with this email")
          }

          // Hash password
          const hashedPassword = await bcrypt.hash(credentials.password, 12)

          const userRole = credentials.role === 'ORGANIZER' ? UserRole.ORGANIZER : UserRole.ATTENDEE

          // Create user
          const user = await prisma.user.create({
            data: {
              email: credentials.email,
              name: credentials.name,
              password: hashedPassword,
              role: userRole,
            }
          })

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            image: user.image,
          }
        }

        // Handle Sign In
        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        })

        if (!user || !user.password) {
          throw new Error("Invalid email or password")
        }

        const isValidPassword = await bcrypt.compare(
          credentials.password,
          user.password
        )

        if (!isValidPassword) {
          throw new Error("Invalid email or password")
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          image: user.image,
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      const current = token.id ? await prisma.user.findUnique({
        where: { id: token.id as string },
        select: { id: true, role: true, name: true, email: true, image: true },
      }) : null
      if (current) {
        session.user = current
      } else {
        // A deleted account must not retain access through an existing JWT.
        Reflect.deleteProperty(session, 'user')
      }
      return session
    }
  },
  pages: {
    signIn: "/auth/signin",
  },
  secret: process.env.NEXTAUTH_SECRET,
}