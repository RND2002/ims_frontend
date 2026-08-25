import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { API_ENDPOINTS } from "@/app/api/endpoints";

export async function POST(request: Request) {
  try {
    const { phone, otp } = await request.json();

    if (!phone || !otp) {
      return NextResponse.json(
        { detail: "Phone and OTP are required." },
        { status: 400 }
      );
    }

    const backendResponse = await fetch(API_ENDPOINTS.backend.auth.otpVerify, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ phone, otp }),
    });

    const data = await backendResponse.json();

    if (!backendResponse.ok) {
      return NextResponse.json(
        { detail: data.detail || "Failed to verify OTP." },
        { status: backendResponse.status }
      );
    }

    if (data.status === "login_success" && data.refresh_token) {
      const cookieStore = await cookies();
      cookieStore.set({
        name: "refresh_token",
        value: data.refresh_token,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/api/auth",
        maxAge: 7 * 24 * 60 * 60, // 7 days
      });

      return NextResponse.json({
        status: "login_success",
        access_token: data.access_token,
      });
    }

    // Hand back "requires_onboarding" status
    return NextResponse.json({
      status: data.status,
    });
  } catch (error: any) {
    return NextResponse.json(
      { detail: error.message || "Internal server error during verify OTP proxy." },
      { status: 500 }
    );
  }
}
