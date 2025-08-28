import { NextRequest, NextResponse } from "next/server"
import { getUserStats } from "@/lib/auth/setup"
import { requireAdmin } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    // Only allow admins to view user stats
    await requireAdmin()
    
    const stats = await getUserStats()
    
    return NextResponse.json({
      success: true,
      data: stats
    })
  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: "Unauthorized" 
      },
      { status: 401 }
    )
  }
}