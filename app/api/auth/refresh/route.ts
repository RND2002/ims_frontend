import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { API_ENDPOINTS } from "@/app/api/endpoints";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const refreshTokenCookie = cookieStore.get("refresh_token");

    if (!refreshTokenCookie || !refreshTokenCookie.value) {
      return NextResponse.json(
        { detail: "No refresh token cookie found. Please log in." },
        { status: 401 }
      );
    }

    const refreshToken = refreshTokenCookie.value;

    const backendResponse = await fetch(API_ENDPOINTS.backend.auth.refresh, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        refresh_token: refreshToken,
      }),
    });

    const data = await backendResponse.json();

    if (!backendResponse.ok) {
      // If refresh token has expired or is invalid, clear the cookie
      cookieStore.set({
        name: "refresh_token",
        value: "",
        httpOnly: true,
        path: "/api/auth",
        maxAge: 0,
      });

      return NextResponse.json(
        { detail: data.detail || "Session refresh failed." },
        { status: backendResponse.status }
      );
    }

    // Set the updated refresh token in httpOnly cookie
    cookieStore.set({
      name: "refresh_token",
      value: data.refresh_token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/api/auth",
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    // Return the new access token to the client (to be kept in memory)
    return NextResponse.json({
      access_token: data.access_token,
      token_type: data.token_type,
    });
  } catch (error: any) {
    return NextResponse.json(
      { detail: error.message || "Internal server error during token refresh." },
      { status: 500 }
    );
  }
}
export async function GET() {
  // Alias GET to POST to make it easy to trigger refresh on mount
  return POST();
}
