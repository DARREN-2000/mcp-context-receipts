import { trace } from "@opentelemetry/api";

export class TracedReceiptChain {
  constructor(chain, tracerName = "mcp-provenance") {
    this.chain = chain;
    this.tracer = trace.getTracer(tracerName);
  }

  async create(args) {
    return await this.tracer.startActiveSpan("mcp.tool.call", async (span) => {
      try {
        const receipt = await this.chain.create(args);
        span.setAttribute("mcp.server", receipt.server);
        span.setAttribute("mcp.tool", receipt.tool);
        span.setAttribute("mcp.duration_ms", receipt.durationMs);
        span.setAttribute("mcp.arguments_hash", receipt.argumentsHash);
        span.setAttribute("mcp.result_hash", receipt.resultHash);
        span.setAttribute("mcp.capsule_hash", receipt.hash);
        return receipt;
      } catch (error) {
        span.recordException(error);
        throw error;
      } finally {
        span.end();
      }
    });
  }

  async verify(receipt, previousHash) {
    return await this.tracer.startActiveSpan("mcp.tool.verify", async (span) => {
      try {
        span.setAttribute("mcp.capsule_hash", receipt.hash);
        const result = await this.chain.verify(receipt, previousHash);
        span.setAttribute("mcp.valid", result.valid);
        return result;
      } catch (error) {
        span.recordException(error);
        throw error;
      } finally {
        span.end();
      }
    });
  }
}
