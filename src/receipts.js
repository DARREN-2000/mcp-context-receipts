import { createHash, createHmac, timingSafeEqual } from "node:crypto";

const sha256 = value => createHash("sha256").update(value).digest("hex");
const canonical = value => JSON.stringify(value === undefined ? null : value);

export class ReceiptChain {
  constructor(secret = process.env.MCP_RECEIPT_SECRET || "local-development-secret") {
    this.secret = secret;
    this.sequence = 0;
    this.previousHash = "GENESIS";
  }

  create({ server, tool, arguments: input, result, durationMs = 0, timestamp = new Date().toISOString() }) {
    const receipt = {
      version: 1,
      sequence: ++this.sequence,
      timestamp,
      server,
      tool,
      argumentsHash: sha256(canonical(input)),
      resultHash: sha256(canonical(result)),
      durationMs,
      previousHash: this.previousHash
    };
    const unsigned = JSON.stringify(receipt);
    receipt.signature = createHmac("sha256", this.secret).update(unsigned).digest("hex");
    receipt.hash = sha256(JSON.stringify(receipt));
    this.previousHash = receipt.hash;
    return receipt;
  }

  verify(receipt, previousHash = receipt.sequence === 1 ? "GENESIS" : receipt.previousHash) {
    const { signature, hash, ...unsignedReceipt } = receipt;
    const expectedSignature = createHmac("sha256", this.secret).update(JSON.stringify(unsignedReceipt)).digest("hex");
    const signatureOk = typeof signature === "string" && signature.length === expectedSignature.length && timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
    const hashOk = hash === sha256(JSON.stringify({ ...unsignedReceipt, signature }));
    return { valid: signatureOk && hashOk && receipt.previousHash === previousHash, signatureOk, hashOk, chainOk: receipt.previousHash === previousHash };
  }
}
