import test from "node:test";
import assert from "node:assert/strict";
import { ReceiptChain } from "../src/receipts.js";

test("creates a verifiable chained receipt without raw payloads", async () => {
  const chain = new ReceiptChain("test-secret");
  const first = await chain.create({ server: "demo", tool: "search", arguments: { q: "mcp" }, result: { count: 2 }, durationMs: 14, timestamp: "2026-01-01T00:00:00.000Z" });
  assert.equal((await chain.verify(first)).valid, true);
  assert.equal("q" in first, false);
  const second = await chain.create({ server: "demo", tool: "fetch", arguments: { id: 1 }, result: "ok", timestamp: "2026-01-01T00:00:01.000Z" });
  assert.equal(second.previousHash, first.hash);
});

test("detects tampering", async () => {
  const chain = new ReceiptChain("test-secret");
  const receipt = await chain.create({ server: "demo", tool: "search", arguments: {}, result: {} });
  receipt.tool = "delete-all";
  assert.equal((await chain.verify(receipt)).valid, false);
});

test("verifies correctly even if JSON keys are reordered", async () => {
  const chain = new ReceiptChain("test-secret");
  const receipt = await chain.create({ server: "demo", tool: "demo", arguments: { b: 2, a: 1 }, result: { y: 2, x: 1 } });
  
  const reorderedReceipt = {
    hash: receipt.hash,
    signature: receipt.signature,
    durationMs: receipt.durationMs,
    version: receipt.version,
    sequence: receipt.sequence,
    timestamp: receipt.timestamp,
    server: receipt.server,
    tool: receipt.tool,
    argumentsHash: receipt.argumentsHash,
    resultHash: receipt.resultHash,
    previousHash: receipt.previousHash
  };
  
  assert.equal((await chain.verify(reorderedReceipt)).valid, true);
});
