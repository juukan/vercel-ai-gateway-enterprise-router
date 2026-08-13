const TOOL_SCHEMA = {
  type: "object",
  required: ["prompt"],
  properties: {
    prompt: { type: "string", description: "The task or content to route." },
    usage: {
      type: "string",
      enum: ["general", "summarization", "translation", "extraction", "support", "analysis", "code", "executive"],
    },
    dataClass: { type: "string", enum: ["public", "internal", "restricted"], default: "public" },
    maxOutputTokens: { type: "integer", minimum: 32, maximum: 8192 },
    maxCostUsd: { type: "number", exclusiveMinimum: 0 },
    forceModelAlias: { type: "string", enum: ["fast", "capable", "frontier", "premium"] },
    capabilities: {
      type: "object",
      properties: {
        tools: { type: "boolean" },
        strictJson: { type: "boolean" },
      },
    },
    images: {
      type: "array",
      maxItems: 4,
      description: "Optional base64 image data URLs. Never send repository secrets or unapproved data.",
      items: { type: "object", required: ["dataUrl"], properties: { dataUrl: { type: "string" } } },
    },
    orgUnit: { type: "string", description: "Low-cardinality organisational unit, never a person or email." },
  },
};

export const TOOLS = [
  {
    name: "route_request",
    description: "Inspect the company policy, modality, model alias, fallback and preflight cost without generating an answer.",
    inputSchema: TOOL_SCHEMA,
  },
  {
    name: "route_and_generate",
    description: "Route a permitted request through the company policy and Vercel AI Gateway, then return the generated answer and decision metadata.",
    inputSchema: TOOL_SCHEMA,
  },
];

function response(id, result) {
  return { jsonrpc: "2.0", id, result };
}

function error(id, code, message) {
  return { jsonrpc: "2.0", id, error: { code, message } };
}

export async function handleMcpMessage(message, env = process.env) {
  if (message.method === "initialize") {
    return response(message.id, {
      protocolVersion: message.params?.protocolVersion ?? "2025-06-18",
      capabilities: { tools: { listChanged: false } },
      serverInfo: { name: "enterprise-model-router", version: "1.0.0" },
      instructions:
        "Classify data before use. Never send credentials, private keys, personal data or unapproved repository content. Prefer route_request first for high-risk, image, internal or costly work. A routed answer is decision support, not proof that an action was executed.",
    });
  }
  if (message.method === "ping") return response(message.id, {});
  if (message.method === "tools/list") return response(message.id, { tools: TOOLS });
  if (message.method === "tools/call") {
    const tool = TOOLS.find((candidate) => candidate.name === message.params?.name);
    if (!tool) return error(message.id, -32602, "Unknown tool");

    const baseUrl = String(env.ENTERPRISE_ROUTER_URL ?? "http://localhost:3000").replace(/\/$/, "");
    const path = tool.name === "route_request" ? "/api/route" : "/api/generate";
    try {
      const httpResponse = await fetch(`${baseUrl}${path}`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(env.ENTERPRISE_ROUTER_TOKEN ? { authorization: `Bearer ${env.ENTERPRISE_ROUTER_TOKEN}` } : {}),
          ...(env.ENTERPRISE_ROUTER_ADMIN_TOKEN
            ? { "x-routing-admin-authorization": `Bearer ${env.ENTERPRISE_ROUTER_ADMIN_TOKEN}` }
            : {}),
        },
        body: JSON.stringify(message.params?.arguments ?? {}),
      });
      const payload = await httpResponse.json();
      return response(message.id, {
        isError: !httpResponse.ok,
        content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
        structuredContent: payload,
      });
    } catch (cause) {
      return response(message.id, {
        isError: true,
        content: [{ type: "text", text: `Router connection failed: ${cause.message}` }],
      });
    }
  }
  if (message.id != null) return error(message.id, -32601, "Method not found");
  return null;
}

