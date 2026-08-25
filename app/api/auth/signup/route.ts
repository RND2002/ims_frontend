import { NextResponse } from "next/server";
import { API_ENDPOINTS } from "@/app/api/endpoints";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const backendResponse = await fetch(API_ENDPOINTS.backend.auth.signup, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await backendResponse.json();

    if (!backendResponse.ok) {
      return NextResponse.json(
        { detail: data.detail || "Signup failed on server." },
        { status: backendResponse.status }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { detail: error.message || "Internal server error during proxy signup." },
      { status: 500 }
    );
  }
}
