import { RouterError } from "@/src/routing/errors.js";
import { publicDecision } from "@/src/routing/public-decision.js";
import { routeRequest } from "@/src/routing/router.js";
import { verifyApiToken } from "@/src/security/override.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(httpRequest) {
  if (!verifyApiToken(httpRequest.headers.get("authorization"), process.env.ROUTER_API_TOKEN)) {
    return Response.json({ error: { code: "unauthorized", message: "Invalid bearer token." } }, { status: 401 });
  }

  const contentLength = Number(httpRequest.headers.get("content-length") ?? 0);
  if (contentLength > 22 * 1024 * 1024) {
    return Response.json(
      { error: { code: "request_too_large", message: "Request body exceeds 22 MB." } },
      { status: 413 },
    );
  }

  try {
    const body = await httpRequest.json();
    const decision = await routeRequest(body, {
      authorizationHeader: httpRequest.headers.get("x-routing-admin-authorization"),
    });
    return Response.json(
      { mode: "route-only", decision: publicDecision(decision) },
      { headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } },
    );
  } catch (error) {
    if (error instanceof RouterError) {
      return Response.json(
        { error: { code: error.code, message: error.message, ...(error.details ? { details: error.details } : {}) } },
        { status: error.status },
      );
    }
    console.error("router_request_failed", { name: error?.name, requestPath: "/api/route" });
    return Response.json(
      { error: { code: "internal_error", message: "The request could not be routed." } },
      { status: 500 },
    );
  }
}
