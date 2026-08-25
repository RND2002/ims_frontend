import { NextResponse } from "next/server";
import { API_ENDPOINTS } from "@/app/api/endpoints";

export async function POST(request: Request) {
  try {
    const { phone } = await request.json();

    if (!phone) {
      return NextResponse.json(
        { detail: "Phone number is required." },
        { status: 400 }
      );
    }

    const backendResponse = await fetch(API_ENDPOINTS.backend.auth.otpSend, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ phone }),
    });

    const data = await backendResponse.json();

    if (!backendResponse.ok) {
      return NextResponse.json(
        { detail: data.detail || "Failed to send OTP." },
        { status: backendResponse.status }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { detail: error.message || "Internal server error during send OTP proxy." },
      { status: 500 }
    );
  }
}
