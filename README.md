# MCP Context Receipts

Privacy-first, tamper-evident receipts for Model Context Protocol tool calls.

MCP makes it easy to give models tools. The missing piece is a small, portable answer to: **what exactly ran, when, and can I prove the record was not edited?**

This project provides a dependency-free Node.js MCP server over stdio with two tools:

- `create_receipt` — hashes the tool arguments and result, then returns a signed receipt.
- `verify_receipt` — verifies the receipt's hash chain and HMAC signature.

Raw arguments and results are never persisted. The server emits only a compact receipt, so it can be piped into logs, an audit store, or a test harness.

## Quick start

Requires Node.js 20+.

```bash
npm start
```

Add it to an MCP client that supports stdio servers:

```json
{
  "mcpServers": {
    "context-receipts": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-context-receipts/src/server.js"],
      "env": { "MCP_RECEIPT_SECRET": "replace-in-your-environment" }
    }
  }
}
```

## Receipt format

Each receipt includes a monotonically increasing sequence number, UTC timestamp, server and tool identity, SHA-256 hashes of the input and output, elapsed time, the previous receipt hash, and an HMAC-SHA256 signature. The chain makes deletion or reordering detectable when receipts are stored externally.

Set `MCP_RECEIPT_SECRET` in the environment for production use. A development fallback is used only to make local exploration easy; the server prints a warning to stderr.

## Development

```bash
npm test
```

The core receipt functions are deliberately separate from the MCP transport so they can be embedded in another MCP server or tested without a running client.

## Status

Early, intentionally small, and useful as a building block. Contributions that add durable sinks, key rotation, or OpenTelemetry export should preserve the default no-raw-payload behavior.

## License

MIT
