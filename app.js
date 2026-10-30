
const LEVELS = ["Public", "Internal", "Confidential", "Secret"];

const levelRank = level => LEVELS.indexOf(level);

const seedDocs = [
 {id:"d1",name:"Pragyan System Overview",category:"Architecture",level:"Public",updated:"30 Oct 2026",content:"PRAGYAN is a fully offline, self-hosted enterprise knowledge assistant built on open-source language models and Retrieval-Augmented Generation (RAG). It answers natural-language questions from organizational documents with source citations. The system is designed for English and Hindi and keeps data within the organization's network."},
 {id:"d2",name:"Knowledge Retrieval Pipeline",category:"Technical Note",level:"Internal",updated:"29 Oct 2026",content:"The retrieval pipeline includes document ingestion, OCR when needed, chunking, multilingual embeddings, hybrid dense and BM25 sparse retrieval, clearance-aware filtering, cross-encoder reranking, grounded generation, self-verification and cited responses. Clearance filtering is applied before ranking."},
 {id:"d3",name:"Clearance Policy Framework",category:"Security Policy",level:"Confidential",updated:"28 Oct 2026",content:"The demo clearance hierarchy is Public, Internal, Confidential and Secret. A user may retrieve documents at or below their clearance. A higher clearance inherits access to lower tiers. A lower clearance must never receive content from a higher tier. Production enforcement must happen server-side at retrieval time."},
 {id:"d4",name:"Offline Deployment Blueprint",category:"Deployment",level:"Internal",updated:"27 Oct 2026",content:"The proposed stack includes FastAPI, React, Qdrant, PostgreSQL, Redis and Celery, multilingual sentence embeddings, an open-source cross-encoder reranker, and a locally served quantized model through Ollama or llama.cpp. Docker and Kubernetes can support deployment in isolated networks."},
 {id:"d5",name:"Research Evaluation Plan",category:"Research",level:"Confidential",updated:"26 Oct 2026",content:"The evaluation compares vanilla RAG, post-hoc filtering and retrieval-stage clearance-aware filtering. Metrics include RAGAS faithfulness, answer relevancy, context precision and recall, leakage rate, retrieval precision@k, recall@k, latency, throughput and memory footprint. Quantization tiers include GGUF Q4, Q5 and Q8."},
 {id:"d6",name:"Hindi-English Retrieval Notes",category:"Research",level:"Internal",updated:"25 Oct 2026",content:"PRAGYAN targets multilingual retrieval in English and Hindi. The proposed embedding layer uses a multilingual sentence-embedding model such as multilingual-e5. Evaluation should measure whether multilingual retrieval affects retrieval quality and access-control correctness."},
 {id:"d7",name:"Threat Model and Audit Notes",category:"Security",level:"Secret",updated:"24 Oct 2026",content:"Security research extensions include prompt-injection resistance, data poisoning considerations and membership-inference risk. Access decisions should be auditable. Retrieval and generation logs should avoid exposing restricted document content to unauthorized users."},
 {id:"d8",name:"Project Impact and SDG Mapping",category:"Impact",level:"Public",updated:"23 Oct 2026",content:"The project aligns with SDG 9 Industry, Innovation and Infrastructure; SDG 16 Peace, Justice and Strong Institutions; SDG 4 Quality Education; and SDG 8 Decent Work and Economic Growth. It aims to support sovereign, resilient AI infrastructure and secure knowledge access."}
];

function loadDocs() {
 try {
  const saved = JSON.parse(localStorage.getItem("pragyan_docs"));
  return Array.isArray(saved) ? saved : seedDocs.map(x => ({...x}));
 } catch {
  return seedDocs.map(x => ({...x}));
 }
}

let docs = loadDocs();
let clearance = localStorage.getItem("pragyan_clearance") || "Confidential";
let queryCount = Number(localStorage.getItem("pragyan_queries") || 12);
let audit = JSON.parse(localStorage.getItem("pragyan_audit") || "[]");
let currentLang = localStorage.getItem("pragyan_lang") || "en";
let toastTimer;

function saveDocs() {
 localStorage.setItem("pragyan_docs", JSON.stringify(docs));
}

function toast(msg) {
 const el = document.getElementById("toast");
 if (!el) return;
 el.textContent = msg;
 el.classList.add("show");
 clearTimeout(toastTimer);
 toastTimer = setTimeout(() => el.classList.remove("show"), 2600);
}

function escapeHTML(s = "") {
 return String(s).replace(/[&<>"']/g, c => ({
  "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"
 }[c]));
}

function canAccess(doc) {
 return levelRank(doc.level) <= levelRank(clearance);
}

function logEvent(action, detail) {
 audit.unshift({
  action,
  detail,
  time: new Date().toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"})
 });
 audit = audit.slice(0, 8);
 localStorage.setItem("pragyan_audit", JSON.stringify(audit));
 renderAudit();
}

function navigate(page) {
 document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
 document.getElementById("page-" + page)?.classList.add("active");

 document.querySelectorAll(".nav-item").forEach(b => {
  b.classList.toggle("active", b.dataset.page === page);
 });

 const label = {
  overview:"Overview",
  assistant:"AI Assistant",
  documents:"Document Vault",
  security:"Access & Security",
  analytics:"Research Analytics"
 };

 document.getElementById("pageCrumb").textContent = label[page] || "Overview";
 document.getElementById("sidebar").classList.remove("open");
 window.scrollTo({top:0, behavior:"smooth"});
}

document.querySelectorAll("[data-page]").forEach(b => {
 b.addEventListener("click", () => navigate(b.dataset.page));
});

document.querySelectorAll("[data-go]").forEach(b => {
 b.addEventListener("click", () => navigate(b.dataset.go));
});

document.getElementById("mobileMenu").addEventListener("click", () => {
 document.getElementById("sidebar").classList.toggle("open");
});

document.getElementById("todayDate").textContent =
 new Date().toLocaleDateString("en-IN", {
  weekday:"short", day:"2-digit", month:"short", year:"numeric"
});

document.getElementById("themeBtn").addEventListener("click", () => {
 document.body.classList.toggle("light");
 localStorage.setItem(
  "pragyan_theme",
  document.body.classList.contains("light") ? "light" : "dark"
 );
});

if (localStorage.getItem("pragyan_theme") === "light") {
 document.body.classList.add("light");
}

// OVERVIEW

function renderOverview() {
 document.getElementById("statDocs").textContent = String(docs.length).padStart(2,"0");
 document.getElementById("statQueries").textContent = queryCount;
 document.getElementById("overviewClearance").textContent = clearance.toUpperCase();

 const recent = [...docs].slice(-4).reverse();

 document.getElementById("recentDocs").innerHTML = recent.map(d => `
  <div class="doc-row">
   <div class="file-icon">▤</div>
   <div class="doc-info">
    <b>${escapeHTML(d.name)}</b>
    <small>${escapeHTML(d.category)} · ${escapeHTML(d.updated)}</small>
   </div>
   <span class="level-pill level-${d.level.toLowerCase()}">${d.level.toUpperCase()}</span>
  </div>
 `).join("");
}

// DOCUMENT VAULT

function renderDocs() {
 const q = document.getElementById("docSearch").value.toLowerCase();
 const filter = document.getElementById("docFilter").value;

 const filtered = docs.filter(d =>
  (filter === "All" || d.level === filter) &&
  (d.name + " " + d.category + " " + d.content).toLowerCase().includes(q)
 );

 document.getElementById("docTable").innerHTML = filtered.map(d => `
  <tr>
   <td>
    <div class="table-doc">
     <div class="file-icon">▤</div>
     <div>${escapeHTML(d.name)}<small>${escapeHTML(d.category)}</small></div>
    </div>
   </td>
   <td>${escapeHTML(d.category)}</td>
   <td><span class="level-pill level-${d.level.toLowerCase()}">${d.level.toUpperCase()}</span></td>
   <td>${escapeHTML(d.updated)}</td>
   <td><span class="status-ready">● READY</span></td>
   <td>
    <div class="row-actions">
     <button data-view="${d.id}">View</button>
     <button data-delete="${d.id}" title="Delete">×</button>
    </div>
   </td>
  </tr>
 `).join("") || `
  <tr><td colspan="6" style="text-align:center;padding:30px">
   No documents match your search.
  </td></tr>
 `;

 document.getElementById("docCount").textContent =
  `${filtered.length} document${filtered.length === 1 ? "" : "s"}`;

 document.getElementById("showingCount").textContent = filtered.length;

 document.querySelectorAll("[data-view]").forEach(b => {
  b.addEventListener("click", () => previewDoc(b.dataset.view));
 });

 document.querySelectorAll("[data-delete]").forEach(b => {
  b.addEventListener("click", () => deleteDoc(b.dataset.delete));
 });
}

function previewDoc(id) {
 const d = docs.find(x => x.id === id);
 if (!d) return;

 document.getElementById("modalTitle").textContent = d.name;
 document.getElementById("modalMeta").textContent =
  `${d.category} · ${d.level.toUpperCase()} · Updated ${d.updated}`;
 document.getElementById("modalContent").textContent = d.content;
 document.getElementById("docModal").classList.add("open");
}

function deleteDoc(id) {
 const d = docs.find(x => x.id === id);
 if (!d) return;

 if (!confirm(`Delete "${d.name}" from this browser's demo vault?`)) return;

 docs = docs.filter(x => x.id !== id);
 saveDocs();
 renderAll();
 logEvent("Document deleted", d.name);
 toast("Document removed from demo vault.");
}

document.getElementById("docSearch").addEventListener("input", renderDocs);
document.getElementById("docFilter").addEventListener("change", renderDocs);

document.getElementById("uploadTrigger").addEventListener("click", () => {
 document.getElementById("fileInput").click();
});

document.getElementById("fileInput").addEventListener("change", async e => {
 const selected = [...e.target.files];

 for (const f of selected) {
  try {
   const text = await f.text();
   if (!text.trim()) continue;

   docs.push({
    id:"u" + Date.now() + Math.random().toString(16).slice(2,6),
    name:f.name.replace(/\.[^.]+$/, ""),
    category:"User upload",
    level:clearance,
    updated:new Date().toLocaleDateString("en-IN", {
     day:"2-digit", month:"short", year:"numeric"
    }),
    content:text.slice(0,30000)
   });

   logEvent("Document uploaded", f.name);
  } catch {
   toast("Could not read " + f.name);
  }
 }

 saveDocs();
 renderAll();
 e.target.value = "";
 toast(`${selected.length} file(s) added to your local demo vault.`);
});

document.getElementById("modalClose").addEventListener("click", () => {
 document.getElementById("docModal").classList.remove("open");
});

document.getElementById("modalDone").addEventListener("click", () => {
 document.getElementById("docModal").classList.remove("open");
});

document.getElementById("docModal").addEventListener("click", e => {
 if (e.target.id === "docModal") {
  e.currentTarget.classList.remove("open");
 }
});

// SECURITY AND CLEARANCE

function setClearance(level) {
 clearance = level;
 localStorage.setItem("pragyan_clearance", level);

 document.getElementById("assistantClearance").value = level;
 document.getElementById("overviewClearance").textContent = level.toUpperCase();

 document.querySelectorAll("#clearanceOptions button").forEach(b => {
  b.classList.toggle("selected", b.dataset.level === level);
 });

 const n = levelRank(level) + 1;

 document.getElementById("scopeLabel").textContent = `${n} / 4`;

 document.querySelectorAll("#meterBars i").forEach((b,i) => {
  b.classList.toggle("filled", i < n);
 });

 logEvent("Clearance context changed", level + " access");
 renderOverview();
 toast(`Demo clearance set to ${level}.`);
}

document.getElementById("assistantClearance").addEventListener("change", e => {
 setClearance(e.target.value);
});

document.querySelectorAll("#clearanceOptions button").forEach(b => {
 b.addEventListener("click", () => setClearance(b.dataset.level));
});

// AI ASSISTANT

const sampleAnswers = [
 {
  keys:["purpose","what is pragyan","about pragyan","project"],
  answer:"PRAGYAN is a fully offline, self-hosted enterprise knowledge assistant. It uses Retrieval-Augmented Generation (RAG) to answer natural-language questions from an organization's own documents, with source citations and document-level clearance controls. It is designed for English and Hindi use in isolated networks.",
  sources:["Pragyan System Overview","Clearance Policy Framework"]
 },
 {
  keys:["pipeline","retrieval","how does it work","steps"],
  answer:"The proposed pipeline works in stages: (1) ingest and parse documents, including OCR for scanned files; (2) create multilingual embeddings; (3) perform hybrid dense-vector and BM25 retrieval; (4) filter candidates by the user's clearance before ranking; (5) rerank permitted passages; (6) generate an answer grounded in those passages; and (7) verify claims and return citations.",
  sources:["Knowledge Retrieval Pipeline"]
 },
 {
  keys:["clearance","access level","classification","secret","confidential"],
  answer:"The hierarchy has four levels: Public, Internal, Confidential and Secret. Access is inherited downward: a user can retrieve documents at or below their clearance level. A Public user cannot retrieve Internal, Confidential or Secret documents. The key research idea is to enforce this filtering at retrieval time, before ranking, rather than filtering only after retrieval.",
  sources:["Clearance Policy Framework"]
 },
 {
  keys:["offline","internet","cloud"],
  answer:"The intended PRAGYAN deployment is fully offline and self-hosted. A local quantized language model can be served using Ollama or llama.cpp, with no cloud fallback. This browser prototype itself is a UI demo; it does not run a local LLM.",
  sources:["Offline Deployment Blueprint","Pragyan System Overview"]
 },
 {
  keys:["technology","stack","fastapi","qdrant","postgres"],
  answer:"The proposed stack includes FastAPI for the backend, React for the frontend, Qdrant for vector search, PostgreSQL for users and metadata, Redis and Celery for background ingestion, multilingual sentence-transformers for embeddings, a cross-encoder reranker, and Ollama or llama.cpp for local quantized inference.",
  sources:["Offline Deployment Blueprint"]
 },
 {
  keys:["research","metric","evaluation","ragas","leakage"],
  answer:"The research plan compares vanilla RAG, post-hoc filtering and retrieval-stage clearance-aware filtering. It measures RAGAS faithfulness, answer relevancy, context precision and recall; leakage rate; retrieval precision@k and recall@k; latency; throughput; and memory footprint across Q4, Q5 and Q8 quantization settings.",
  sources:["Research Evaluation Plan"]
 },
 {
  keys:["hindi","language","multilingual"],
  answer:"PRAGYAN targets English and Hindi retrieval. The proposal suggests a multilingual embedding model such as multilingual-e5. One research question is whether Hindi-English retrieval changes retrieval quality or access-control correctness.",
  sources:["Hindi-English Retrieval Notes"]
 },
 {
  keys:["sdg","impact","sustainable"],
  answer:"The project maps to SDG 9 (Industry, Innovation and Infrastructure), SDG 16 (Peace, Justice and Strong Institutions), SDG 4 (Quality Education), and SDG 8 (Decent Work and Economic Growth).",
  sources:["Project Impact and SDG Mapping"]
 }
];

function findAnswer(q) {
 const normalized = q.toLowerCase();
 const permitted = docs.filter(canAccess);

 const matched = sampleAnswers.find(a =>
  a.keys.some(k => normalized.includes(k))
 );

 if (matched) {
  const visibleSources = matched.sources.filter(name =>
   permitted.some(d => d.name === name)
  );

  if (visibleSources.length) {
   return {answer:matched.answer, sources:visibleSources};
  }
 }

 const docMatches = permitted.filter(d =>
  (d.name + " " + d.category + " " + d.content)
   .toLowerCase()
   .split(/\W+/)
   .some(w => w.length > 4 && normalized.includes(w))
 );

 if (docMatches.length) {
  const d = docMatches[0];

  return {
   answer:`I found relevant information in **${d.name}**. ${d.content.slice(0,520)}${d.content.length > 520 ? "…" : ""}`,
   sources:[d.name]
  };
 }

 return {
  answer:"I couldn't find a supported answer in the documents available at your current clearance level. Try rephrasing your question or ask your workspace administrator to verify that the relevant document is classified correctly. I won't guess beyond the available knowledge base.",
  sources:[]
 };
}

function addMessage(role, text, sources = []) {
 const wrap = document.getElementById("chatMessages");
 const div = document.createElement("div");

 div.className = "message " + (role === "user" ? "user-message" : "assistant-message");

 const avatar = role === "user" ? "AJ" : "✳";
 const label = role === "user" ? "YOU" : "PRAGYAN";

 let safe = escapeHTML(text)
  .replace(/\*\*(.*?)\*\*/g, "<b>$1</b>")
  .replace(/\n/g, "<br>");

 const sourceHTML = sources.length
  ? `<div class="source-card"><b>▤ SOURCE REFERENCES</b>${sources.map(s => `<small>↳ ${escapeHTML(s)} · permitted source</small>`).join("<br>")}</div>`
  : "";

 div.innerHTML = `
  <div class="message-avatar">${avatar}</div>
  <div class="message-body">
   <div class="message-meta">${label}
    <span>${new Date().toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"})}</span>
   </div>
   <div class="bubble">
    ${safe}${sourceHTML}
    <br><span class="demo-disclaimer">Illustrative local demo response · not generated by an LLM.</span>
   </div>
  </div>
 `;

 wrap.appendChild(div);
 wrap.scrollTop = wrap.scrollHeight;
}

function sendQuestion(q) {
 if (!q.trim()) return;

 addMessage("user", q);

 const result = findAnswer(q);
 addMessage("assistant", result.answer, result.sources);

 queryCount++;
 localStorage.setItem("pragyan_queries", queryCount);

 document.getElementById("statQueries").textContent = queryCount;

 logEvent("Knowledge query", `Question searched at ${clearance} clearance`);
}

document.getElementById("chatForm").addEventListener("submit", e => {
 e.preventDefault();

 const input = document.getElementById("chatInput");
 sendQuestion(input.value);
 input.value = "";
});

document.getElementById("chatInput").addEventListener("keydown", e => {
 if (e.key === "Enter" && !e.shiftKey) {
  e.preventDefault();
  document.getElementById("chatForm").requestSubmit();
 }
});

document.querySelectorAll(".suggestion").forEach(b => {
 b.addEventListener("click", () => {
  document.getElementById("chatInput").value = b.dataset.prompt;
  document.getElementById("chatForm").requestSubmit();
 });
});

document.getElementById("clearChat").addEventListener("click", () => {
 document.getElementById("chatMessages").innerHTML = "";
 addMessage("assistant", "Conversation cleared. Ask a new question about the permitted knowledge base.");
 toast("Conversation cleared.");
});

// AUDIT LOG

function renderAudit() {
 const el = document.getElementById("auditLog");
 if (!el) return;

 const rows = audit.length ? audit : [
  {action:"Workspace initialized",detail:"Local demo session started",time:"Just now"},
  {action:"Clearance policy loaded",detail:"Confidential demo profile",time:"Just now"},
  {action:"Knowledge base ready",detail:`${docs.length} sample documents available`,time:"Just now"}
 ];

 el.innerHTML = rows.slice(0,6).map(x => `
  <div class="audit-row">
   <div class="audit-icon">✓</div>
   <div>
    <b>${escapeHTML(x.action)}</b>
    <small>${escapeHTML(x.detail)}</small>
   </div>
   <span class="audit-time">${escapeHTML(x.time)}</span>
  </div>
 `).join("");
}

// LANGUAGE SWITCH

document.getElementById("languageBtn").addEventListener("click", () => {
 currentLang = currentLang === "en" ? "hi" : "en";
 localStorage.setItem("pragyan_lang", currentLang);

 document.getElementById("languageBtn").textContent =
  currentLang === "en" ? "हि" : "EN";

 document.querySelectorAll("[data-i18n]").forEach(el => {
  const map = {
   overview:["Overview","अवलोकन"],
   assistant:["AI Assistant","एआई सहायक"],
   documents:["Document Vault","दस्तावेज़ भंडार"],
   security:["Access & Security","पहुँच और सुरक्षा"],
   analytics:["Research Analytics","रिसर्च विश्लेषण"]
  };

  if (map[el.dataset.i18n]) {
   el.textContent = map[el.dataset.i18n][currentLang === "en" ? 0 : 1];
  }
 });

 toast(currentLang === "hi" ? "नेविगेशन हिंदी में बदल गया।" : "Navigation switched to English.");
});

if (currentLang === "hi") {
 document.getElementById("languageBtn").textContent = "EN";

 document.querySelectorAll("[data-i18n]").forEach(el => {
  const map = {
   overview:"अवलोकन",
   assistant:"एआई सहायक",
   documents:"दस्तावेज़ भंडार",
   security:"पहुँच और सुरक्षा",
   analytics:"रिसर्च विश्लेषण"
  };

  if (map[el.dataset.i18n]) {
   el.textContent = map[el.dataset.i18n];
  }
 });
}

// INITIALIZATION

if (!LEVELS.includes(clearance)) {
 clearance = "Confidential";
}

document.getElementById("assistantClearance").value = clearance;

document.querySelectorAll("#clearanceOptions button").forEach(b => {
 b.classList.toggle("selected", b.dataset.level === clearance);
});

document.getElementById("scopeLabel").textContent =
 `${levelRank(clearance) + 1} / 4`;

document.querySelectorAll("#meterBars i").forEach((b,i) => {
 b.classList.toggle("filled", i <= levelRank(clearance));
});

function renderAll() {
 renderOverview();
 renderDocs();
 renderAudit();
}

renderAll();

