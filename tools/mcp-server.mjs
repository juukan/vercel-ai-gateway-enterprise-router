#!/usr/bin/env node
import { createInterface } from "node:readline";
import { handleMcpMessage } from "./mcp-core.mjs";

const lines = createInterface({ input: process.stdin, crlfDelay: Infinity });

for await (const line of lines) {
  if (!line.trim()) continue;
  try {
    const message = JSON.parse(line);
    const reply = await handleMcpMessage(message);
    if (reply) process.stdout.write(`${JSON.stringify(reply)}\n`);
  } catch (error) {
    process.stdout.write(
      `${JSON.stringify({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } })}\n`,
    );
    process.stderr.write(`enterprise-model-router: ${error.message}\n`);
  }
}

