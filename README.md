# PRAGYAN AI — SIH1450 Frontend Prototype

A dark, futuristic, responsive frontend prototype for **PRAGYAN: Access-Clearance-Aware Retrieval-Augmented Generation for Fully Offline, Multilingual Enterprise Knowledge Systems**.

## Repository name

`pragyan-ai-knowledge-assistant`

## Features in this prototype

- Responsive dashboard with Overview, AI Assistant, Document Vault, Access & Security, and Research Analytics pages.
- Sample knowledge base with Public, Internal, Confidential, and Secret classification.
- Interactive clearance selector with hierarchical access filtering in the browser demo.
- Demo question answering from the sample documents, with source references and a refusal when no permitted source is found.
- Upload, preview, search, filter, and delete TXT, Markdown, CSV, and JSON documents.
- Browser-local persistence using `localStorage`.
- Hindi/English navigation toggle and dark/light theme toggle.
- Session audit events.

## Run locally

1. Download or clone this repository.
2. Open `index.html` in a modern browser.
3. For a local development server, run:

   ```bash
   python -m http.server 8000
   ```

4. Open `http://localhost:8000`.

No build step is required.

## Deploy on GitHub Pages

1. Create a public GitHub repository named `pragyan-ai-knowledge-assistant`.
2. Upload `index.html`, `styles.css`, `app.js`, and this `README.md` to the repository root.
3. Open **Settings → Pages**.
4. Under **Build and deployment**, select **Deploy from a branch**.
5. Select branch `main` and folder `/ (root)`, then Save.
6. Wait for GitHub Pages to publish the site.

## Important: prototype vs production system

This repository is a **frontend demonstration**, not the complete offline RAG platform. The demo's retrieval logic and clearance selector run in browser JavaScript and are not a security boundary. Browser storage can be modified by the user. Do not upload real confidential, secret, personal, or organizational data to this prototype.

The complete PRAGYAN architecture described in the research document requires a separate backend and local infrastructure:

- FastAPI API and authenticated identity management
- Server-side clearance middleware and retrieval-time filtering
- Qdrant vector database with dense/sparse hybrid retrieval
- PostgreSQL for users, document metadata, and audit logs
- Redis/Celery for asynchronous ingestion
- Multilingual embeddings and cross-encoder reranking
- Local quantized LLM served through Ollama or llama.cpp
- OCR and document parsing for PDF/DOCX/scanned documents
- Docker-based offline deployment and evaluation

The frontend must call the backend only after authentication. Authorization must be enforced on the server **before ranking and generation**, not merely hidden in the interface.

## Suggested next backend milestone

Implement `POST /api/auth/login`, `POST /api/documents/ingest`, `GET /api/documents`, and `POST /api/chat`. The chat endpoint should derive the user's clearance from the authenticated session, apply clearance filters inside retrieval, and return answer text plus source metadata. Never trust a clearance value supplied by the browser.

## Project identity

**PRAGYAN — Secure Intelligence. Offline Knowledge. Trusted Answers.**

Aligned with the SIH1450 problem statement and the project's research focus on access-clearance-aware retrieval under offline, quantized inference.
