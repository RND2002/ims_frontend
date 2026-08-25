import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  try {
    const cookieStore = await cookies();
    
    // Clear the refresh token cookie by setting its maxAge to 0
    cookieStore.set({
      name: "refresh_token",
      value: "",
      httpOnly: true,
      path: "/api/auth",
      maxAge: 0,
    });

    return NextResponse.json({ message: "Logged out successfully." });
  } catch (error: any) {
    return NextResponse.json(
      { detail: error.message || "Failed to log out." },
      { status: 500 }
    );
  }
}
export async function GET() {
  return POST();
}
