const encoder = new TextEncoder();

const sha256 = async (value) => {
  const data = typeof value === "string" ? encoder.encode(value) : encoder.encode(JSON.stringify(value));
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("");
};

const importKey = async (secret) => {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
};

const signHmac = async (key, data) => {
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, "0")).join("");
};

const canonical = value => {
  if (value === undefined) return "null";
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (typeof value.toJSON === "function") return canonical(value.toJSON());
  if (Array.isArray(value)) return `[${value.map(v => v === undefined ? "null" : canonical(v)).join(",")}]`;
  const keys = Object.keys(value).sort();
  const parts = [];
  for (const k of keys) {
    if (value[k] !== undefined) {
      parts.push(`${JSON.stringify(k)}:${canonical(value[k])}`);
    }
  }
  return `{${parts.join(",")}}`;
};

export class ReceiptChain {
  constructor(secret = typeof process !== "undefined" && process.env.MCP_RECEIPT_SECRET ? process.env.MCP_RECEIPT_SECRET : "local-development-secret", options = {}) {
    this.secrets = (typeof secret === "string" ? secret.split(",") : Array.isArray(secret) ? secret : []).map(s => s.trim()).filter(Boolean);
    if (this.secrets.length === 0) throw new Error("At least one secret is required");
    this.sequence = 0;
    this.previousHash = "GENESIS";
    this._keyPromises = this.secrets.map(importKey);
    this.sink = options.sink || null;
  }

  async create({ server, tool, arguments: input, result, durationMs = 0, timestamp = new Date().toISOString() }) {
    const key = await this._keyPromises[0];
    const receipt = {
      version: 1,
      sequence: ++this.sequence,
      timestamp,
      server,
      tool,
      argumentsHash: await sha256(canonical(input)),
      resultHash: await sha256(canonical(result)),
      durationMs,
      previousHash: this.previousHash
    };
    const unsigned = canonical(receipt);
    receipt.signature = await signHmac(key, unsigned);
    receipt.hash = await sha256(canonical(receipt));
    this.previousHash = receipt.hash;
    
    if (this.sink) {
      if (typeof this.sink === "function") {
        await this.sink(receipt);
      } else if (typeof this.sink.write === "function") {
        await this.sink.write(JSON.stringify(receipt) + "\n");
      }
    }
    
    return receipt;
  }

  async verify(receipt, previousHash = receipt.sequence === 1 ? "GENESIS" : this.previousHash) {
    const { signature, hash, ...unsignedReceipt } = receipt;
    const unsignedCanonical = canonical(unsignedReceipt);
    
    let signatureOk = false;
    for (const keyPromise of this._keyPromises) {
      const key = await keyPromise;
      const expectedSignature = await signHmac(key, unsignedCanonical);
      if (typeof signature === "string" && signature.length === expectedSignature.length) {
        let match = 0;
        for (let i = 0; i < expectedSignature.length; i++) {
          match |= signature.charCodeAt(i) ^ expectedSignature.charCodeAt(i);
        }
        if (match === 0) {
          signatureOk = true;
          break;
        }
      }
    }
    
    const expectedHash = await sha256(canonical({ ...unsignedReceipt, signature }));
    let hashOk = false;
    if (typeof hash === "string" && hash.length === expectedHash.length) {
      let match = 0;
      for (let i = 0; i < expectedHash.length; i++) {
        match |= hash.charCodeAt(i) ^ expectedHash.charCodeAt(i);
      }
      hashOk = match === 0;
    }
    
    return { valid: signatureOk && hashOk && receipt.previousHash === previousHash, signatureOk, hashOk, chainOk: receipt.previousHash === previousHash };
  }
}
