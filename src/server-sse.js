import { createServer } from "node:http";
import { ReceiptChain } from "./receipts.js";

const chain = new ReceiptChain();
let clients = new Set();
let messageId = 0;

const sendEvent = (res, event, data) => {
  if (event) res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
};

export const startSSEServer = (port = 3000) => {
  const server = createServer(async (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    
    if (req.method === "OPTIONS") {
      res.writeHead(204);
      return res.end();
    }

    if (req.url === "/sse") {
      res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive"
      });
      clients.add(res);
      const clientId = `client-${Date.now()}`;
      sendEvent(res, "endpoint", `/messages?sessionId=${clientId}`);
      
      req.on("close", () => clients.delete(res));
      return;
    }

    if (req.url.startsWith("/messages") && req.method === "POST") {
      let body = "";
      req.on("data", chunk => { body += chunk; });
      req.on("end", async () => {
        try {
          const request = JSON.parse(body);
          const { id, method, params = {} } = request;
          let responseResult = null;
          let responseError = null;
          
          if (method === "initialize") {
            responseResult = { protocolVersion: "2024-11-05", capabilities: { tools: {} }, serverInfo: { name: "mcp-context-receipts", version: "0.1.0" } };
          } else if (method === "tools/list") {
            responseResult = { tools: [
              { name: "create_receipt", description: "Create a privacy-first signed receipt", inputSchema: { type: "object", required: ["server", "tool"], properties: { server: { type: "string" }, tool: { type: "string" }, arguments: { type: "object" }, result: {}, durationMs: { type: "number" } } } },
              { name: "verify_receipt", description: "Verify a receipt", inputSchema: { type: "object", required: ["receipt"], properties: { receipt: { type: "object" } } } }
            ] };
          } else if (method === "tools/call") {
            const receipt = params.name === "create_receipt" ? await chain.create(params.arguments || {}) : params.name === "verify_receipt" ? await chain.verify(params.arguments?.receipt) : null;
            if (receipt === null) throw new Error("Unknown tool");
            responseResult = { content: [{ type: "text", text: JSON.stringify(receipt) }], isError: false };
          } else if (id !== undefined) {
            responseError = { code: -32601, message: "Method not found" };
          }

          if (id !== undefined) {
            const payload = { jsonrpc: "2.0", id, ...(responseError ? { error: responseError } : { result: responseResult }) };
            for (const client of clients) sendEvent(client, "message", payload);
          }
          res.writeHead(202);
          res.end();
        } catch (err) {
          res.writeHead(400);
          res.end(err.message);
        }
      });
      return;
    }
    
    res.writeHead(404);
    res.end();
  });

  server.listen(port, () => console.log(`SSE Server running on port ${port}`));
  return server;
};

if (process.argv[1] === import.meta.filename) {
  startSSEServer(process.env.PORT || 3000);
}
