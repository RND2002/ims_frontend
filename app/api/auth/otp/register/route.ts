import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { API_ENDPOINTS } from "@/app/api/endpoints";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phone, name } = body;

    if (!phone || !name) {
      return NextResponse.json(
        { detail: "Phone and name are required." },
        { status: 400 }
      );
    }

    const backendResponse = await fetch(API_ENDPOINTS.backend.auth.otpRegister, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await backendResponse.json();

    if (!backendResponse.ok) {
      return NextResponse.json(
        { detail: data.detail || "Registration failed." },
        { status: backendResponse.status }
      );
    }

    if (data.refresh_token) {
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
    }

    return NextResponse.json({
      access_token: data.access_token,
    });
  } catch (error: any) {
    return NextResponse.json(
      { detail: error.message || "Internal server error during registration proxy." },
      { status: 500 }
    );
  }
}
