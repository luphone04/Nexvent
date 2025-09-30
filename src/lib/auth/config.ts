import { NextAuthOptions } from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/db"
import { UserRole } from "@prisma/client"

export const authConfig: NextAuthOptions = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  adapter: PrismaAdapter(prisma) as any, // Required for Next-Auth adapter compatibility
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
        isSignUp: { 
          label: "Is Sign Up", 
          type: "hidden" 
        }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required")
        }

        // Handle Sign Up
        if (credentials.isSignUp === "true") {
          if (!credentials.name) {
            throw new Error("Name is required for sign up")
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

          // Check if this is the first user (should become admin)
          const userCount = await prisma.user.count()
          const isFirstUser = userCount === 0

          // Create user
          const user = await prisma.user.create({
            data: {
              email: credentials.email,
              name: credentials.name,
              password: hashedPassword,
              role: isFirstUser ? UserRole.ADMIN : UserRole.ATTENDEE,
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
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
      }
      return session
    }
  },
  pages: {
    signIn: "/auth/signin",
  },
  secret: process.env.NEXTAUTH_SECRET,
}