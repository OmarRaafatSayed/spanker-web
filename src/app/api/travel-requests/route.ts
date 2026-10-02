import { NextRequest } from "next/server";

/**
 * POST /api/travel-requests
 *
 * Transparent proxy to /api/v1/travel-requests for backward compatibility.
 * All business logic lives in the v1 route; this file is a pass-through only.
 *
 * Requirements: 7.2
 *
 * Bug_Condition: handler wrote to module-scope let _requests array with
 *   hardcoded customer_id: "mock-user-001"
 * Expected_Behavior: POST proxies to v1 route which inserts a real DB row;
 *   response is identical to the v1 route's response
 *
 * Preservation: POST /api/travel-requests URL and HTTP method remain valid
 *   for backward compatibility with any existing client code.
 */
export async function POST(request: NextRequest) {
  const origin =
    request.headers.get("origin") ?? "http://localhost:3000";

  const response = await fetch(`${origin}/api/v1/travel-requests`, {
    method: "POST",
    headers: {
      "content-type":
        request.headers.get("content-type") ?? "application/json",
      cookie: request.headers.get("cookie") ?? "",
    },
    body: request.body,
    // @ts-expect-error — duplex is required by Node fetch when streaming body
    duplex: "half",
  });

  return new Response(response.body, {
    status: response.status,
    headers: response.headers,
  });
}
