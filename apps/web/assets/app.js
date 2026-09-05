const state = {
  provider: null,
  signer: null,
  contract: null,
  account: null,
  deployment: null,
  pendingProof: null,
};

const $ = (selector) => document.querySelector(selector);

function setStatus(message, tone = "neutral") {
  const node = $("#app-status");
  node.textContent = message;
  node.dataset.tone = tone;
}

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    return Object.keys(value)
      .sort()
      .reduce((result, key) => {
        result[key] = canonicalize(value[key]);
        return result;
      }, {});
  }
  return value;
}

function bytesToHex(bytes) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function digestRecord(payload, saltHex) {
  const canonical = JSON.stringify(canonicalize(payload));
  const input = new TextEncoder().encode(`${saltHex}:${canonical}`);
  const digest = await crypto.subtle.digest("SHA-256", input);
  return `0x${bytesToHex(new Uint8Array(digest))}`;
}

function parseList(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 20);
}

function formatAddress(address) {
  if (!address) return "-";
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

function formatHash(hash) {
  if (!hash) return "-";
  return `${hash.slice(0, 12)}…${hash.slice(-10)}`;
}

async function loadDeployment() {
  const response = await fetch("/assets/deployment.json", { cache: "no-store" });
  if (!response.ok) throw new Error("Deployment configuration could not be loaded.");
  state.deployment = await response.json();
  $("#deployment-network").textContent = state.deployment.network || "not-deployed";
  $("#deployment-address").textContent = state.deployment.address
    ? formatAddress(state.deployment.address)
    : "deploy contract first";
}

async function connectWallet() {
  if (!window.ethereum) {
    throw new Error("MetaMask-compatible wallet was not found.");
  }
  if (!state.deployment?.address) {
    throw new Error("Contract is not deployed. Run npm run deploy:local first.");
  }

  state.provider = new ethers.BrowserProvider(window.ethereum);
  await state.provider.send("eth_requestAccounts", []);
  state.signer = await state.provider.getSigner();
  state.account = await state.signer.getAddress();
  state.contract = new ethers.Contract(
    state.deployment.address,
    window.MEDICAL_RECORD_REGISTRY_ABI,
    state.signer
  );

  $("#wallet-address").textContent = formatAddress(state.account);
  setStatus("Wallet connected. On-chain views contain hashes only.", "success");
  await refreshRecords();
}

function requireContract() {
  if (!state.contract || !state.account) {
    throw new Error("Connect your wallet first.");
  }
}

async function anchorRecord(event) {
  event.preventDefault();
  requireContract();

  const recordType = $("#record-type").value.trim();
  const note = $("#record-note").value.trim();
  if (!recordType || !note) throw new Error("Record type and note are required.");

  const payload = {
    version: 1,
    recordType,
    note,
    createdLocallyAt: new Date().toISOString(),
  };

  const salt = new Uint8Array(32);
  crypto.getRandomValues(salt);
  const saltHex = bytesToHex(salt);
  const dataHash = await digestRecord(payload, saltHex);
  const recordTypeHash = ethers.keccak256(ethers.toUtf8Bytes(recordType.toLocaleLowerCase("en-US")));

  setStatus("Submitting integrity proof to the blockchain…");
  const tx = await state.contract.addRecord(state.account, dataHash, recordTypeHash);
  const receipt = await tx.wait();

  state.pendingProof = {
    schema: "healthchain-proof/v1",
    patient: state.account,
    contract: state.deployment.address,
    chainId: state.deployment.chainId,
    payload,
    saltHex,
    dataHash,
    recordTypeHash,
    transactionHash: receipt.hash,
  };

  $("#proof-digest").textContent = dataHash;
  $("#download-proof").disabled = false;
  $("#record-note").value = "";
  setStatus("Record hash anchored. Keep the local proof bundle private.", "success");
  await refreshRecords();
}

function downloadProof() {
  if (!state.pendingProof) return;
  const blob = new Blob([`${JSON.stringify(state.pendingProof, null, 2)}\n`], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `healthchain-proof-${Date.now()}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

async function verifyProofFile(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  const proof = JSON.parse(await file.text());
  const recomputed = await digestRecord(proof.payload, proof.saltHex);
  const valid = recomputed.toLowerCase() === String(proof.dataHash || "").toLowerCase();
  $("#verify-result").textContent = valid
    ? "Proof bundle is internally consistent."
    : "Proof verification failed: payload or salt does not match the digest.";
  $("#verify-result").dataset.tone = valid ? "success" : "danger";
}

async function setProviderAuthorization(event) {
  event.preventDefault();
  requireContract();

  const providerAddress = $("#provider-address").value.trim();
  if (!ethers.isAddress(providerAddress)) throw new Error("Enter a valid provider wallet address.");
  const authorized = $("#provider-authorized").checked;

  setStatus("Updating provider authorization…");
  const tx = await state.contract.setProviderAuthorization(providerAddress, authorized);
  await tx.wait();
  setStatus(`Provider ${authorized ? "authorized" : "revoked"}.`, "success");
}

function appendCell(row, value, className = "") {
  const cell = document.createElement("td");
  cell.textContent = value;
  if (className) cell.className = className;
  row.appendChild(cell);
}

async function refreshRecords() {
  requireContract();
  const body = $("#records-body");
  body.replaceChildren();

  const count = Number(await state.contract.getRecordCount(state.account));
  $("#record-count").textContent = String(count);

  for (let index = count - 1; index >= 0; index -= 1) {
    const record = await state.contract.getRecord(state.account, index);
    const row = document.createElement("tr");
    appendCell(row, String(index));
    appendCell(row, formatHash(record.dataHash), "mono");
    appendCell(row, formatAddress(record.author), "mono");
    appendCell(row, new Date(Number(record.createdAt) * 1000).toLocaleString());
    appendCell(row, record.revoked ? "revoked" : "active", record.revoked ? "status-danger" : "status-ok");
    body.appendChild(row);
  }

  if (!count) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 5;
    cell.textContent = "No integrity proofs anchored for this wallet.";
    cell.className = "empty-state";
    row.appendChild(cell);
    body.appendChild(row);
  }
}

async function requestClinicalEducation(event) {
  event.preventDefault();
  const consent = $("#ai-consent").checked;
  if (!consent) throw new Error("Consent is required before sending health context to the AI provider.");

  const payload = {
    symptoms: parseList($("#ai-symptoms").value),
    conditions: parseList($("#ai-conditions").value),
    medications: parseList($("#ai-medications").value),
    question: $("#ai-question").value.trim(),
    aiDataConsent: true,
  };

  const button = $("#ai-submit");
  button.disabled = true;
  $("#ai-result").textContent = "Generating educational decision-support notes…";

  try {
    const response = await fetch("/api/v1/clinical-education", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.details?.join(" ") || data.error || "AI request failed.");
    }
    $("#ai-result").textContent = `${data.result}\n\n${data.disclaimer}`;
  } finally {
    button.disabled = false;
  }
}

function bindAsync(selector, eventName, handler) {
  $(selector).addEventListener(eventName, async (event) => {
    try {
      await handler(event);
    } catch (error) {
      console.error(error);
      setStatus(error.message || "Unexpected error.", "danger");
    }
  });
}

async function boot() {
  await loadDeployment();
  bindAsync("#connect-wallet", "click", connectWallet);
  bindAsync("#record-form", "submit", anchorRecord);
  bindAsync("#provider-form", "submit", setProviderAuthorization);
  bindAsync("#refresh-records", "click", refreshRecords);
  bindAsync("#ai-form", "submit", requestClinicalEducation);
  bindAsync("#proof-file", "change", verifyProofFile);
  $("#download-proof").addEventListener("click", downloadProof);

  if (window.ethereum) {
    window.ethereum.on?.("accountsChanged", () => window.location.reload());
    window.ethereum.on?.("chainChanged", () => window.location.reload());
  }
}

boot().catch((error) => {
  console.error(error);
  setStatus(error.message || "Application failed to initialize.", "danger");
});
