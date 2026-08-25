import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { API_ENDPOINTS } from "@/app/api/endpoints";

export async function POST(request: Request) {
  try {
    const { phone, password } = await request.json();

    if (!phone || !password) {
      return NextResponse.json(
        { detail: "Phone and password are required." },
        { status: 400 }
      );
    }

    // Format request body as x-www-form-urlencoded for FastAPI's OAuth2 login handler
    const formData = new URLSearchParams();
    formData.append("username", phone);
    formData.append("password", password);

    const backendResponse = await fetch(API_ENDPOINTS.backend.auth.token, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    });

    const data = await backendResponse.json();

    if (!backendResponse.ok) {
      return NextResponse.json(
        { detail: data.detail || "Authentication failed." },
        { status: backendResponse.status }
      );
    }

    // Set the long-lived refresh token in a secure httpOnly cookie
    const cookieStore = await cookies();
    cookieStore.set({
      name: "refresh_token",
      value: data.refresh_token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/api/auth",
      maxAge: 7 * 24 * 60 * 60, // 7 days matching backend expiry
    });

    // Return the short-lived access token in the response body (stored in client memory)
    return NextResponse.json({
      access_token: data.access_token,
      token_type: data.token_type,
    });
  } catch (error: any) {
    return NextResponse.json(
      { detail: error.message || "Internal server error during login proxy." },
      { status: 500 }
    );
  }
}
