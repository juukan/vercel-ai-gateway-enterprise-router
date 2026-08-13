import assert from "node:assert/strict";
import test from "node:test";
import { handleMcpMessage, TOOLS } from "../tools/mcp-core.mjs";

test("MCP exposes route and generation tools", async () => {
  const reply = await handleMcpMessage({ jsonrpc: "2.0", id: 1, method: "tools/list" });
  assert.deepEqual(reply.result.tools.map((tool) => tool.name), ["route_request", "route_and_generate"]);
  assert.equal(TOOLS[0].inputSchema.required.includes("prompt"), true);
});

test("MCP initialization includes safety instructions", async () => {
  const reply = await handleMcpMessage({
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: { protocolVersion: "2025-06-18" },
  });
  assert.equal(reply.result.protocolVersion, "2025-06-18");
  assert.match(reply.result.instructions, /Never send credentials/);
});

