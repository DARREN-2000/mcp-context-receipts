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

test("supports key rotation", async () => {
  const chainV1 = new ReceiptChain("old-secret");
  const receiptV1 = await chainV1.create({ server: "demo", tool: "test", arguments: {}, result: {} });
  
  const chainV2 = new ReceiptChain(["new-secret", "old-secret"]);
  assert.equal((await chainV2.verify(receiptV1)).valid, true);
  
  // Continue chain manually for testing
  chainV2.previousHash = receiptV1.hash;
  chainV2.sequence = receiptV1.sequence;
  const receiptV2 = await chainV2.create({ server: "demo", tool: "test", arguments: {}, result: {} });
  assert.equal((await chainV1.verify(receiptV2, receiptV1.hash)).valid, false); // Old chain shouldn't verify new receipt
  assert.equal((await chainV2.verify(receiptV2, receiptV1.hash)).valid, true); // New chain should verify new receipt
});

test("supports durable sinks", async () => {
  let sinkCalledWith = null;
  const sink = (receipt) => { sinkCalledWith = receipt; };
  const chain = new ReceiptChain("secret", { sink });
  
  const receipt = await chain.create({ server: "demo", tool: "test", arguments: {}, result: {} });
  assert.equal(sinkCalledWith, receipt);
});
