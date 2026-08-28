/**
 * Catch-all proxy for /api/v1/* → backend
 *
 * This replaces the next.config.ts rewrite for /api/v1/*.
 * Being a Next.js Route Handler, it runs server-side and reads
 * NEXT_PUBLIC_API_URL fresh on every request — so switching between
 * local (127.0.0.1:8000) and remote (15.252.107.170) only requires
 * changing the .env file, no dev-server restart needed.
 */
import { NextRequest, NextResponse } from "next/server";

const BACKEND_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

async function proxyRequest(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const pathStr = path.join("/");

  // Preserve query string
  const searchParams = request.nextUrl.searchParams.toString();
  const targetUrl = `${BACKEND_BASE}/api/v1/${pathStr}${searchParams ? `?${searchParams}` : ""}`;

  // Forward all original headers (Authorization, X-Store-ID, Content-Type, etc.)
  const forwardHeaders: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    // Skip headers that should not be forwarded to backend
    if (!["host", "connection", "transfer-encoding"].includes(key.toLowerCase())) {
      forwardHeaders[key] = value;
    }
  });

  const fetchOptions: RequestInit = {
    method: request.method,
    headers: forwardHeaders,
  };

  // Forward body for non-GET/HEAD requests
  if (!["GET", "HEAD"].includes(request.method)) {
    const contentType = request.headers.get("content-type") || "";
    if (contentType.includes("multipart/form-data")) {
      // Stream formdata directly
      fetchOptions.body = await request.arrayBuffer();
    } else {
      fetchOptions.body = await request.text();
    }
  }

  try {
    const backendResponse = await fetch(targetUrl, fetchOptions);

    // Stream response back
    const responseBody = await backendResponse.arrayBuffer();
    const responseHeaders = new Headers();
    backendResponse.headers.forEach((value, key) => {
      if (!["transfer-encoding", "connection"].includes(key.toLowerCase())) {
        responseHeaders.set(key, value);
      }
    });

    return new NextResponse(responseBody, {
      status: backendResponse.status,
      headers: responseHeaders,
    });
  } catch (err: any) {
    console.error(`[api/v1 proxy] Failed to reach ${targetUrl}:`, err.message);
    return NextResponse.json(
      { detail: "Backend unreachable. Is the local server running?" },
      { status: 502 }
    );
  }
}

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PUT = proxyRequest;
export const PATCH = proxyRequest;
export const DELETE = proxyRequest;
