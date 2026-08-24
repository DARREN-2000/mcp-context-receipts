import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

test("JSON-RPC server handles tool calls", async () => {
  const serverPath = join(__dirname, "../src/server.js");
  const child = spawn(process.execPath, [serverPath], {
    env: { ...process.env, MCP_RECEIPT_SECRET: "test-secret" }
  });

  const responses = [];
  child.stdout.on("data", (data) => {
    const lines = data.toString().split("\n").filter(Boolean);
    for (const line of lines) {
      responses.push(JSON.parse(line));
    }
  });

  const send = (msg) => {
    child.stdin.write(JSON.stringify(msg) + "\n");
  };

  send({ jsonrpc: "2.0", id: 1, method: "initialize", params: {} });
  send({ jsonrpc: "2.0", id: 2, method: "tools/call", params: { name: "create_receipt", arguments: { server: "demo", tool: "demo", arguments: {}, result: {} } } });

  await new Promise((resolve) => setTimeout(resolve, 500));
  
  const callResponse = responses.find(r => r.id === 2);
  const receipt = JSON.parse(callResponse.result.content[0].text);
  
  send({ jsonrpc: "2.0", id: 3, method: "tools/call", params: { name: "verify_receipt", arguments: { receipt } } });
  
  await new Promise((resolve) => setTimeout(resolve, 500));
  child.kill();

  const initResponse = responses.find(r => r.id === 1);
  assert.ok(initResponse.result.capabilities.tools);

  assert.equal(receipt.server, "demo");
  assert.ok(receipt.signature);
  
  const verifyResponse = responses.find(r => r.id === 3);
  const verifyResult = JSON.parse(verifyResponse.result.content[0].text);
  assert.ok(verifyResult.valid);
});
