import test from "node:test";
import assert from "node:assert/strict";
import { ReceiptChain } from "../src/receipts.js";

test("creates a verifiable chained receipt without raw payloads", () => {
  const chain = new ReceiptChain("test-secret");
  const first = chain.create({ server: "demo", tool: "search", arguments: { q: "mcp" }, result: { count: 2 }, durationMs: 14, timestamp: "2026-01-01T00:00:00.000Z" });
  assert.equal(chain.verify(first).valid, true);
  assert.equal("q" in first, false);
  const second = chain.create({ server: "demo", tool: "fetch", arguments: { id: 1 }, result: "ok", timestamp: "2026-01-01T00:00:01.000Z" });
  assert.equal(second.previousHash, first.hash);
});

test("detects tampering", () => {
  const chain = new ReceiptChain("test-secret");
  const receipt = chain.create({ server: "demo", tool: "search", arguments: {}, result: {} });
  receipt.tool = "delete-all";
  assert.equal(chain.verify(receipt).valid, false);
});
