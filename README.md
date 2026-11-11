# PaperMind AI — Intelligent Research Paper Assistant

[![Python 3.10+](https://img.shields.io/badge/Python-3.10%2B-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111%2B-009688.svg)](https://fastapi.tiangolo.com/)
[![React 18](https://img.shields.io/badge/React-18.3-61DAFB.svg)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC.svg)](https://tailwindcss.com/)
[![Qdrant](https://img.shields.io/badge/Vector%20DB-Qdrant-DC2626.svg)](https://qdrant.tech/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791.svg)](https://www.postgresql.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

> A production-minded, full-stack AI research paper assistant powered by Retrieval-Augmented Generation (RAG). Upload complex academic PDFs, ask in-depth technical questions, receive strictly grounded answers with verifiable page-level citations, generate structured 7-section paper summaries, and synthesize multi-paper comparison matrices with zero hallucinations.

---

## 1. Problem Statement & Motivation

Traditional LLM chat interfaces hallucinate facts, invent citations, and extrapolate unsupported conclusions when queried about complex scientific papers. Researchers need an evidence-tethered system that:
1. **Never guesses or hallucinates** when evidence is missing.
2. **Explicitly preserves physical source page numbers** so claims can be audited in seconds.
3. **Deconstructs lengthy papers** into standardized analytical dimensions (Objectives, Methodology, Datasets, Results, Limitations, Conclusions).
4. **Enables cross-paper comparative synthesis** across multiple PDFs simultaneously.

---

## 2. Core Features

- **Zero-Hallucination Grounded Q&A**: Strict negative constraints instruct the model to report insufficient evidence if the uploaded papers do not contain the answer.
- **Verifiable Page-Level Citations**: Every generated answer provides clickable citation cards indicating the document name, exact 1-indexed page number, similarity score, and excerpt snippet.
- **Multi-PDF Querying**: Query across multiple papers simultaneously to cross-examine techniques, benchmarks, and architectures.
- **7-Section Structured Summaries**: Automated extraction of Abstract, Objectives, Methodology, Datasets, Results, Limitations, and Conclusions.
- **Side-by-Side Paper Comparison Matrix**: Select 2 to 5 papers to generate a comparative dimension matrix and synthesize key differences and trade-offs.
- **Multi-Tenant User Isolation**: JWT-authenticated sessions ensure users can only view, query, and delete documents and chat sessions belonging to their account.
- **Enterprise-Grade UI/UX**: Dark Navy (`#0B0F19`) and Royal Violet (`#7C3AED`) aesthetics, responsive split-view layouts, and instant 1-click test login.

---

## 3. Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS, React Router v6, Axios, Lucide React icons |
| **Backend** | Python 3.10+, FastAPI, Pydantic v2, SQLAlchemy 2.0, Alembic, Uvicorn |
| **Vector Engine** | Qdrant Vector Database (Cosine similarity, 384-dimensional dense vectors) |
| **Embeddings** | `sentence-transformers/all-MiniLM-L6-v2` |
| **PDF Ingestion** | PyMuPDF (`fitz`) for deterministic page-by-page text extraction |
| **LLM & Synthesis** | Google Gemini API (`gemini-1.5-flash`), Grounded Context Prompting |
| **Relational Database** | PostgreSQL 16 (Users, Documents, Chat Sessions, Messages, Citations, Summaries) |
| **Testing** | Pytest, Pytest-Asyncio, HTTPX |
| **Containerization** | Docker, Docker Compose |

---

## 4. System Architecture

```
[ Uploaded PDF ]
       │
       ▼
[ PyMuPDF Page-by-Page Extractor ] ──> Preserves 1-indexed page numbers
       │
       ▼
[ Page-Preserving Chunker ] ─────────> Overlapping boundary-aware chunks
       │
       ▼
[ Sentence-Transformers ] ───────────> 384-dim all-MiniLM-L6-v2 embeddings
       │
       ▼
[ Qdrant Vector Database ] ──────────> Cosine similarity index with user isolation
       ▲
       │ Filtered Search (User + Doc IDs)
       │
[ User Research Query ] ─────────────> Query Embedding
       │
       ▼
[ Grounding Engine & Gemini LLM ] ───> Strict negative constraints & citation tags
       │
       ▼
[ Grounded Answer + Source Citations with Page Numbers ]
```

---

## 5. Folder Structure

```
paper-mind-ai/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── v1/
│   │   │   │   ├── endpoints/
│   │   │   │   │   ├── auth.py          # /register, /login, /me
│   │   │   │   │   ├── documents.py     # /upload, list, detail, delete
│   │   │   │   │   ├── chat.py          # /ask, sessions, message history
│   │   │   │   │   └── research.py      # /summarize, /compare, /search
│   │   │   │   └── router.py
│   │   │   └── deps.py                  # Database session & JWT auth dependencies
│   │   ├── core/                        # Config, security (bcrypt/JWT), logging
│   │   ├── db/                          # Base declarative model, session, init_db
│   │   ├── models/                      # SQLAlchemy models (User, Document, Chat, Citation)
│   │   ├── schemas/                     # Pydantic v2 schemas
│   │   ├── services/                    # PDF parsing, Qdrant client, Gemini client
│   │   ├── rag/                         # Chunker, Embedder, Prompts, RAG Engine
│   │   └── main.py                      # FastAPI application entrypoint
│   ├── tests/                           # Comprehensive Pytest test suite (12 tests)
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/                  # Buttons, Badges, Modals, Citations
│   │   ├── context/                     # AuthContext with 1-click test login
│   │   ├── layouts/                     # AppLayout with Sidebar and navigation
│   │   ├── pages/                       # Landing, Dashboard, Library, Chat, Summary, Compare, Settings
│   │   └── services/                    # Axios API client & auth services
│   ├── Dockerfile
│   └── package.json
├── docs/                                # Architecture & RAG evaluation specifications
├── docker-compose.yml
├── .env.example
├── .gitignore
└── README.md
```

---

## 6. Installation & Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+ & npm
- PostgreSQL (or Docker)

### 1. Backend Setup
```powershell
# Navigate to project root
cd paper-mind-ai

# Activate virtual environment
backend\venv\Scripts\activate

# Install dependencies
pip install -r backend/requirements.txt

# Configure environment variables
cp .env.example .env

# Initialize database schema and demo researcher account
$env:PYTHONPATH="backend"
python backend/app/db/init_db.py

# Launch FastAPI backend
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

### 2. Frontend Setup
```powershell
# In a separate terminal
cd paper-mind-ai/frontend

# Install frontend dependencies
npm install

# Start Vite development server
npm run dev
```

Visit **`http://localhost:5173`** in your browser.

---

## 7. Demo Credentials

You can click **"Launch 1-Click Researcher Demo"** on the landing page or login manually:
- **Email**: `researcher@papermind.ai`
- **Password**: `ResearchPass2026!`

---

## 8. API Documentation

Once the backend is running, interactive Swagger API documentation is available at:
- **Swagger UI**: `http://127.0.0.1:8000/docs`
- **ReDoc**: `http://127.0.0.1:8000/redoc`

### Key Endpoints:
- `POST /api/v1/auth/register` — Register new user account
- `POST /api/v1/auth/login/json` — Authenticate and receive JWT token
- `POST /api/v1/documents/upload` — Ingest PDF, extract text, chunk, and index in Qdrant
- `GET /api/v1/documents` — List user's indexed research papers
- `DELETE /api/v1/documents/{id}` — Purge document and vector index
- `POST /api/v1/chat/ask` — Ask question with grounded citations and page numbers
- `GET /api/v1/chat/sessions` — Retrieve persistent conversation sessions
- `POST /api/v1/research/summarize` — Generate 7-section structured summary
- `POST /api/v1/research/compare` — Generate multi-paper comparative matrix

---

## 9. Automated Testing Suite

Execute the comprehensive Pytest test suite covering authentication, extraction, chunking, embeddings, vector search, RAG grounding, summarization, and security isolation:

```powershell
$env:PYTHONPATH="backend"
backend\venv\Scripts\python.exe -m pytest backend/tests/ -v -o pythonpath=backend
```

**Results:**
```text
backend/tests/test_phase1.py::test_health_check PASSED                   [  8%]
backend/tests/test_phase1.py::test_user_registration_and_login PASSED    [ 16%]
backend/tests/test_phase1.py::test_demo_user_login PASSED                [ 25%]
backend/tests/test_phase2_ingestion.py::test_pdf_validation PASSED       [ 33%]
backend/tests/test_phase2_ingestion.py::test_page_accurate_extraction PASSED [ 41%]
backend/tests/test_phase2_ingestion.py::test_page_preserving_chunking PASSED [ 50%]
backend/tests/test_phase2_ingestion.py::test_embedding_generation PASSED [ 58%]
backend/tests/test_phase2_ingestion.py::test_qdrant_vector_upsert_and_search PASSED [ 66%]
backend/tests/test_phase3_rag.py::test_rag_zero_hallucination_insufficient_context PASSED [ 75%]
backend/tests/test_phase3_rag.py::test_rag_grounded_answer_with_citations PASSED [ 83%]
backend/tests/test_phase4_research.py::test_research_summarize_and_compare PASSED [ 91%]
backend/tests/test_phase5_security.py::test_cross_user_isolation PASSED  [100%]

======================= 12 passed in 24.89s =======================
```

---

## 10. Containerized Deployment (Docker Compose)

Deploy the entire stack with a single command:
```bash
docker-compose up --build
```
This provisions:
- PostgreSQL 16 on port `5432`
- Qdrant Vector Database on port `6333`
- FastAPI Application on port `8000`
- Nginx + React Frontend on port `80`

---

## 11. Future Roadmap

- [ ] PDF visual bounding-box highlights directly rendered on top of original pages.
- [ ] Export comparison matrices directly to LaTeX and Markdown tables.
- [ ] Zotero and Mendeley literature library sync.
- [ ] Graph-RAG ontology integration linking citations across arXiv preprints.
