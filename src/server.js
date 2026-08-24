#!/usr/bin/env node
import readline from "node:readline";
import { ReceiptChain } from "./receipts.js";

const chain = new ReceiptChain();
const rl = readline.createInterface({ input: process.stdin, crlfDelay: Infinity });
const send = (id, result, error) => process.stdout.write(JSON.stringify({ jsonrpc: "2.0", id, ...(error ? { error } : { result }) }) + "\n");

for await (const line of rl) {
  if (!line.trim()) continue;
  let request;
  try { request = JSON.parse(line); } catch { continue; }
  const { id, method, params = {} } = request;
  if (method === "initialize") {
    send(id, { protocolVersion: "2024-11-05", capabilities: { tools: {} }, serverInfo: { name: "mcp-provenance-capsules", version: "0.3.0" } });
  } else if (method === "notifications/initialized") {
    continue;
  } else if (method === "tools/list") {
    send(id, { tools: [
      { name: "create_receipt", description: "Create a privacy-first signed receipt for an MCP tool call.", inputSchema: { type: "object", required: ["server", "tool"], properties: { server: { type: "string" }, tool: { type: "string" }, arguments: { type: "object" }, result: {}, durationMs: { type: "number" } } }, readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
      { name: "verify_receipt", description: "Verify a receipt's signature and content hash.", inputSchema: { type: "object", required: ["receipt"], properties: { receipt: { type: "object" } } }, readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }
    ] });
  } else if (method === "tools/call") {
    try {
      const receipt = params.name === "create_receipt" ? await chain.create(params.arguments || {}) : params.name === "verify_receipt" ? await chain.verify(params.arguments?.receipt) : null;
      if (receipt === null) throw new Error("Unknown tool");
      send(id, { content: [{ type: "text", text: JSON.stringify(receipt) }], isError: false });
    } catch (error) { send(id, null, { code: -32602, message: error.message }); }
  } else if (id !== undefined) {
    send(id, null, { code: -32601, message: "Method not found" });
  }
}
