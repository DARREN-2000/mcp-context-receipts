#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { ReceiptChain } from "../src/receipts.js";

const file = process.argv[2];
if (!file) {
  console.error("Usage: verify-capsule <capsule.json|capsules.jsonl>");
  process.exit(2);
}

const input = await readFile(file, "utf8");
const capsules = file.endsWith(".jsonl")
  ? input.split(/\r?\n/).filter(Boolean).map(line => JSON.parse(line))
  : [JSON.parse(input)];
const chain = new ReceiptChain();
let previous = "GENESIS";
let valid = true;
for (const capsule of capsules) {
  const result = await chain.verify(capsule, previous);
  console.log(JSON.stringify({ sequence: capsule.sequence, hash: capsule.hash, ...result }));
  valid &&= result.valid;
  previous = capsule.hash;
}
process.exit(valid ? 0 : 1);
