"use client";

import { useState, useRef, useEffect } from "react";
// @ts-ignore
import { ReceiptChain } from "../../src/receipts.js";

export default function Home() {
  const [chain] = useState(() => new ReceiptChain("playground-secret"));
  
  const [serverName, setServerName] = useState("demo-server");
  const [toolName, setToolName] = useState("fetch_data");
  const [argumentsJson, setArgumentsJson] = useState(`{\n  "query": "test",\n  "limit": 10\n}`);
  const [resultJson, setResultJson] = useState(`{\n  "items": [1, 2, 3]\n}`);
  const [duration, setDuration] = useState("42");
  
  const [generatedReceipt, setGeneratedReceipt] = useState("");
  const [verifyStatus, setVerifyStatus] = useState<any>(null);

  const handleCreate = async () => {
    try {
      const receipt = await chain.create({
        server: serverName,
        tool: toolName,
        arguments: JSON.parse(argumentsJson),
        result: JSON.parse(resultJson),
        durationMs: parseInt(duration, 10)
      });
      setGeneratedReceipt(JSON.stringify(receipt, null, 2));
      setVerifyStatus(null);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleVerify = async () => {
    try {
      const receipt = JSON.parse(generatedReceipt);
      const result = await chain.verify(receipt, receipt.sequence === 1 ? "GENESIS" : chain.previousHash);
      setVerifyStatus(result);
    } catch (err: any) {
      setVerifyStatus({ error: err.message });
    }
  };

  return (
    <div className="min-h-screen flex flex-col selection:bg-indigo-500/30 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400">
      <header className="sticky top-0 z-50 w-full backdrop-blur flex-none transition-colors duration-500 lg:border-b lg:border-slate-900/10 dark:border-slate-50/[0.06] bg-white/95 dark:bg-slate-900/75">
        <div className="max-w-7xl mx-auto">
          <div className="py-4 border-b border-slate-900/10 lg:px-8 lg:border-0 dark:border-slate-300/10 mx-4 lg:mx-0 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h1 className="text-lg font-semibold text-slate-900 dark:text-white">MCP Provenance Capsules</h1>
            </div>
            <div className="flex items-center gap-4">
              <a href="https://m8ven.ai/mcp/darren-2000-mcp-context-receipts-h3hy7a" target="_blank" rel="noreferrer" className="hover:opacity-80 transition-opacity">
                <img src="https://m8ven.ai/badge/mcp/darren-2000-mcp-context-receipts-h3hy7a" alt="M8ven Score" className="h-6" />
              </a>
              <div className="text-sm font-medium leading-6 text-slate-700 dark:text-slate-200">
                Next.js Playground
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-10 max-w-3xl">
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Interactive Playground</h2>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
            Generate privacy-first cryptographic evidence capsules for MCP tool calls, and verify their integrity without exposing raw arguments or results. Since it uses the native Web Crypto API, it runs entirely in your browser.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* GENERATE SECTION */}
          <section className="flex flex-col gap-6">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm ring-1 ring-slate-200 dark:ring-slate-700/50 overflow-hidden flex flex-col h-full">
              <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800/50">
                <h3 className="text-base font-semibold leading-6 text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-xs font-medium text-indigo-600 dark:text-indigo-400">1</span>
                  Create a Capsule
                </h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Simulate an MCP tool call payload</p>
              </div>
              <div className="p-6 flex-1 flex flex-col gap-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium leading-6 text-slate-900 dark:text-white">Server Name</label>
                    <input type="text" value={serverName} onChange={e => setServerName(e.target.value)} className="mt-2 block w-full rounded-md border-0 py-2 px-3 text-slate-900 dark:text-slate-100 dark:bg-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 dark:ring-slate-700 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium leading-6 text-slate-900 dark:text-white">Tool Name</label>
                    <input type="text" value={toolName} onChange={e => setToolName(e.target.value)} className="mt-2 block w-full rounded-md border-0 py-2 px-3 text-slate-900 dark:text-slate-100 dark:bg-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 dark:ring-slate-700 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium leading-6 text-slate-900 dark:text-white">Arguments (JSON)</label>
                  <textarea rows={3} value={argumentsJson} onChange={e => setArgumentsJson(e.target.value)} className="mt-2 block w-full rounded-md border-0 py-2 px-3 text-slate-900 dark:text-slate-100 dark:bg-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 dark:ring-slate-700 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm font-mono sm:leading-6" />
                </div>
                
                <div>
                  <label className="block text-sm font-medium leading-6 text-slate-900 dark:text-white">Result (JSON)</label>
                  <textarea rows={3} value={resultJson} onChange={e => setResultJson(e.target.value)} className="mt-2 block w-full rounded-md border-0 py-2 px-3 text-slate-900 dark:text-slate-100 dark:bg-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 dark:ring-slate-700 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm font-mono sm:leading-6" />
                </div>
                
                <div>
                  <label className="block text-sm font-medium leading-6 text-slate-900 dark:text-white">Duration (ms)</label>
                  <input type="number" value={duration} onChange={e => setDuration(e.target.value)} className="mt-2 block w-full rounded-md border-0 py-2 px-3 text-slate-900 dark:text-slate-100 dark:bg-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 dark:ring-slate-700 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" />
                </div>

                <div className="mt-auto pt-4">
                  <button onClick={handleCreate} className="w-full rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-all flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    Generate Receipt
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* VERIFY SECTION */}
          <section className="flex flex-col gap-6">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm ring-1 ring-slate-200 dark:ring-slate-700/50 overflow-hidden flex flex-col h-full">
              <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800/50">
                <h3 className="text-base font-semibold leading-6 text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-xs font-medium text-emerald-600 dark:text-emerald-400">2</span>
                  Verify the Capsule
                </h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Review, tamper, and cryptographically verify</p>
              </div>
              
              <div className="p-6 flex-1 flex flex-col gap-5">
                <div className="flex-1 flex flex-col min-h-[300px]">
                  <label className="block text-sm font-medium leading-6 text-slate-900 dark:text-white">Generated Receipt (JSON)</label>
                  <textarea value={generatedReceipt} onChange={e => setGeneratedReceipt(e.target.value)} className="mt-2 block w-full flex-1 rounded-md border-0 py-3 px-4 text-slate-900 dark:text-slate-300 dark:bg-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 dark:ring-slate-700 focus:ring-2 focus:ring-inset focus:ring-emerald-600 sm:text-sm font-mono sm:leading-6 transition-all" spellCheck={false} placeholder="Generate a receipt to see it here..." />
                </div>

                <div className="pt-2">
                  <button onClick={handleVerify} className="w-full rounded-md bg-slate-800 dark:bg-slate-700 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-700 dark:hover:bg-slate-600 transition-all flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    Verify Receipt
                  </button>
                </div>

                {verifyStatus && (
                  <div className={`rounded-lg p-4 mt-2 border ${verifyStatus.valid ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/50" : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/50"}`}>
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <h4 className={`text-sm font-bold ${verifyStatus.valid ? "text-emerald-800 dark:text-emerald-300" : "text-red-800 dark:text-red-300"}`}>
                          {verifyStatus.valid ? "Signature Verified!" : "Verification Failed"}
                        </h4>
                        <div className="mt-2 text-sm space-y-1">
                          {verifyStatus.error ? (
                            <p className="text-red-600 dark:text-red-400">{verifyStatus.error}</p>
                          ) : (
                            <>
                              <p className="text-slate-600 dark:text-slate-400">Signature: {verifyStatus.signatureOk ? "✅ Valid" : "❌ Invalid"}</p>
                              <p className="text-slate-600 dark:text-slate-400">Content Hash: {verifyStatus.hashOk ? "✅ Valid" : "❌ Mismatch"}</p>
                              <p className="text-slate-600 dark:text-slate-400">Chain Hash: {verifyStatus.chainOk ? "✅ Valid" : "❌ Mismatch"}</p>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </main>
      
      <footer className="mt-auto py-8 border-t border-slate-900/5 dark:border-slate-700/50 text-center text-sm text-slate-500 dark:text-slate-400">
        <p>Powered by Web Crypto API. No data leaves your browser.</p>
      </footer>
    </div>
  );
}
