# MCP Provenance Capsules

**Portable, privacy-first evidence for every MCP tool call.**

MCP gives models access to powerful tools. Provenance Capsules answer the hard question that follows: what ran, exactly, and can anyone verify the record later?

This project is a tiny, dependency-free universal library (Node.js, Deno, Bun, Browser) and an MCP server that emits cryptographically linked evidence without storing raw prompts, arguments, or results.

## Playground
You can try the library directly in your browser without any setup!
**[Try the GitHub Pages Playground here!](https://your-username.github.io/mcp-provenance-capsules/docs/)**

## Why this is not another audit log

- **Privacy by default:** only SHA-256 digests leave the call boundary; raw payloads stay in the caller.
- **Tamper evident:** each capsule carries an HMAC signature and the previous capsule hash.
- **Portable:** JSON capsules and JSONL streams work with object storage, SIEMs, test fixtures, or a database.
- **MCP-native:** use it as a stdio server with any compatible client, or import the core class into an existing server.
- **Universal & Robust:** Uses the native Web Crypto API so it works universally in browsers, Node 20+, Deno, and Edge Workers. Features a deterministic JSON stringifier to eliminate fragile signature failures due to key reordering.
- **Verifiable later:** anyone holding the capsule stream and verification secret can detect edits, deletion, and reordering.
- **Small surface:** Zero runtime dependencies, no hosted service required.

## Quick start

Requires Node.js 20+ (for the MCP server).

    npm start

Configure an MCP client with command `node` and argument `/absolute/path/to/mcp-provenance-capsules/src/server.js`. Set `MCP_RECEIPT_SECRET` outside source control.

The server exposes `create_receipt` and `verify_receipt` tools.

## Embed it

Import `ReceiptChain` from `src/receipts.js`, construct it with your secret, and `await chain.create(...)`. Because it uses the native Web Crypto API, all operations are asynchronous.

```javascript
import { ReceiptChain } from "./src/receipts.js";

const chain = new ReceiptChain("your-secret");

// Create a receipt
const receipt = await chain.create({
  server: "demo",
  tool: "fetch_data",
  arguments: { id: 123 },
  result: { status: "ok" },
  durationMs: 42
});

// Verify a receipt
const verification = await chain.verify(receipt);
console.log(verification.valid); // true
```

## Capsule anatomy

A capsule contains a version, sequence number, UTC timestamp, server and tool identity, argument and result hashes, duration, previous hash, HMAC signature, and its own hash. The canonical schema lives at `schema/capsule.schema.json`.

The chain is storage-agnostic: write JSONL to object storage, a database, or your existing audit pipeline. The library never persists data itself.

## Verify a stream

Set the same secret used when creating capsules, then run `MCP_RECEIPT_SECRET='your-secret' npx verify-capsule capsules.jsonl`.

The command prints one machine-readable verification result per capsule and exits non-zero if any signature, hash, or chain link fails.

## Security notes

Use a high-entropy secret from your deployment secret manager. Rotate secrets by starting a new chain and recording the rotation boundary in storage. HMAC proves integrity to parties that possess the secret; it is not a public, non-repudiable signature.

## Product boundary

This project is not a hosted compliance platform, payload recorder, or replacement for authorization. It is the evidence layer underneath those systems.

## Development

    npm test

MIT licensed. Contributions are welcome, especially durable sinks, key rotation, OpenTelemetry export, and adapters for additional MCP transports—while preserving the no-raw-payload default.
