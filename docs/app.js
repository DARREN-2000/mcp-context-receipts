import { ReceiptChain } from "../src/receipts.js";

const chain = new ReceiptChain("playground-secret");

// Elements
const elServer = document.getElementById("server");
const elTool = document.getElementById("tool");
const elArguments = document.getElementById("arguments");
const elResult = document.getElementById("result");
const elDuration = document.getElementById("duration");

const btnCreate = document.getElementById("btnCreate");
const inputVerify = document.getElementById("inputVerify");
const btnVerify = document.getElementById("btnVerify");

const verifyResultContainer = document.getElementById("verifyResultContainer");
const verifyIcon = document.getElementById("verifyIcon");
const verifyStatus = document.getElementById("verifyStatus");
const verifyDetails = document.getElementById("verifyDetails");

// Icons
const iconSuccess = `<svg class="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`;
const iconError = `<svg class="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`;

// Helpers
const updateVerifyUI = (status, title, details, isError = false) => {
  verifyResultContainer.classList.remove("hidden");
  verifyResultContainer.className = `rounded-lg p-4 mt-2 border ${
    isError 
      ? "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-900/50" 
      : "bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-900/50"
  }`;
  
  verifyIcon.innerHTML = isError ? iconError : iconSuccess;
  
  verifyStatus.className = `text-sm font-bold ${
    isError ? "text-red-800 dark:text-red-400" : "text-emerald-800 dark:text-emerald-400"
  }`;
  verifyStatus.textContent = title;
  
  verifyDetails.className = `mt-2 text-sm space-y-1 ${
    isError ? "text-red-700 dark:text-red-300" : "text-emerald-700 dark:text-emerald-300"
  }`;
  verifyDetails.innerHTML = details;
};

// Generate Capsule
btnCreate.addEventListener("click", async () => {
  try {
    const argsObj = JSON.parse(elArguments.value || "{}");
    const resultObj = JSON.parse(elResult.value || "{}");
    
    // Add loading state
    const originalText = btnCreate.innerHTML;
    btnCreate.innerHTML = `<svg class="animate-spin -ml-1 mr-3 h-4 w-4 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Generating...`;
    btnCreate.disabled = true;

    const receipt = await chain.create({
      server: elServer.value,
      tool: elTool.value,
      arguments: argsObj,
      result: resultObj,
      durationMs: parseInt(elDuration.value, 10) || 0
    });
    
    const json = JSON.stringify(receipt, null, 2);
    inputVerify.value = json;
    
    // Reset verify UI
    verifyResultContainer.classList.add("hidden");

    // Restore button
    btnCreate.innerHTML = originalText;
    btnCreate.disabled = false;
    
    // Quick flash effect on textarea to indicate update
    inputVerify.classList.add("ring-2", "ring-indigo-500", "dark:ring-indigo-400");
    setTimeout(() => {
      inputVerify.classList.remove("ring-2", "ring-indigo-500", "dark:ring-indigo-400");
    }, 500);

  } catch (err) {
    btnCreate.innerHTML = `<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg> Generate Receipt`;
    btnCreate.disabled = false;
    alert("Error generating receipt. Please ensure Arguments and Result are valid JSON.\n\n" + err.message);
  }
});

// Verify Capsule
btnVerify.addEventListener("click", async () => {
  try {
    const inputStr = inputVerify.value;
    if (!inputStr.trim()) {
      updateVerifyUI(false, "No Receipt to Verify", "Please generate a receipt or paste one into the box.", true);
      return;
    }
    
    const receiptToVerify = JSON.parse(inputStr);
    
    const originalText = btnVerify.innerHTML;
    btnVerify.innerHTML = `<svg class="animate-spin -ml-1 mr-3 h-4 w-4 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Verifying...`;
    btnVerify.disabled = true;

    const result = await chain.verify(receiptToVerify);
    
    btnVerify.innerHTML = originalText;
    btnVerify.disabled = false;
    
    if (result.valid) {
      updateVerifyUI(
        true,
        "Cryptographically Valid",
        `<div><span class="font-semibold">Signature OK:</span> ${result.signatureOk}</div>
         <div><span class="font-semibold">Hash OK:</span> ${result.hashOk}</div>`
      );
    } else {
      updateVerifyUI(
        false,
        "Invalid or Tampered!",
        `<div><span class="font-semibold">Signature OK:</span> ${result.signatureOk}</div>
         <div><span class="font-semibold">Hash OK:</span> ${result.hashOk}</div>
         <div class="mt-2 text-xs opacity-80">The receipt content does not match its cryptographic signature or hash chain.</div>`,
        true
      );
    }
  } catch (err) {
    btnVerify.disabled = false;
    btnVerify.innerHTML = `<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> Verify Receipt`;
    updateVerifyUI(false, "Verification Error", `Could not parse JSON or verify: ${err.message}`, true);
  }
});
