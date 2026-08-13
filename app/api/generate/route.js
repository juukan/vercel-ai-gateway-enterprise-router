import { generateFromDecision } from "@/src/gateway/generate.js";
import { RouterError } from "@/src/routing/errors.js";
import { publicDecision } from "@/src/routing/public-decision.js";
import { routeRequest } from "@/src/routing/router.js";
import { verifyApiToken } from "@/src/security/override.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function json(payload, status = 200) {
  return Response.json(payload, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export async function POST(httpRequest) {
  if (!verifyApiToken(httpRequest.headers.get("authorization"), process.env.ROUTER_API_TOKEN)) {
    return json({ error: { code: "unauthorized", message: "A valid API bearer token is required." } }, 401);
  }

  const contentLength = Number(httpRequest.headers.get("content-length") ?? 0);
  if (contentLength > 22 * 1024 * 1024) {
    return json({ error: { code: "request_too_large", message: "Request body exceeds 22 MB." } }, 413);
  }

  try {
    const body = await httpRequest.json();
    const decision = await routeRequest(body, {
      authorizationHeader: httpRequest.headers.get("x-routing-admin-authorization"),
    });

    if (process.env.ROUTER_DRY_RUN === "true") {
      return json({ mode: "dry-run", decision: publicDecision(decision) });
    }

    const generation = await generateFromDecision(decision);
    return json({ mode: "generated", decision: publicDecision(decision), generation });
  } catch (error) {
    if (error instanceof RouterError) {
      return json(
        { error: { code: error.code, message: error.message, ...(error.details ? { details: error.details } : {}) } },
        error.status,
      );
    }
    console.error("router_request_failed", { name: error?.name, requestPath: "/api/generate" });
    return json({ error: { code: "internal_error", message: "The request could not be completed." } }, 500);
  }
}

