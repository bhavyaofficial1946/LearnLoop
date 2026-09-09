# LearnLoop

> **Know what you need to learn next.**

LearnLoop is a production-structured personalized learning platform that transforms syllabi and academic goals into structured learning workspaces. It establishes a complete relational knowledge foundation, mapping course syllabi against canonical prerequisite graphs so students know what they need to master before they start studying.

---

## Architecture Overview

```
Student → Academic Setup → Structured Syllabus → Knowledge Map → Persistent Study Workspace
```

```
LearnLoop/
├── backend/                  # FastAPI Backend (Python 3.12+)
│   ├── app/
│   │   ├── api/routes/       # REST API endpoints (/api/*)
│   │   │   ├── students.py   # Student profile endpoints
│   │   │   ├── subjects.py   # Canonical subjects & tree endpoints
│   │   │   ├── workspaces.py # Workspace lifecycle & overview
│   │   │   ├── syllabus.py   # PDF extraction & parsing
│   │   │   └── materials.py  # Syllabus and PYQ uploads
│   │   ├── config/           # Application settings & environment
│   │   ├── db/               # Database engine, session, and seeders
│   │   ├── models/           # SQLAlchemy 2.0 ORM models
│   │   ├── schemas/          # Pydantic v2 validation schemas
│   │   └── services/         # Business logic layer
│   │       ├── syllabus_service.py   # PDF text parsing & topic normalization
│   │       ├── workspace_service.py  # Workspace aggregations & stats
│   │       ├── knowledge_service.py  # Relational prerequisite resolution
│   │       └── material_service.py   # Academic file storage & validation
│   ├── migrations/           # Alembic database migrations
│   └── requirements.txt      # Python dependencies
│
├── frontend/                 # Next.js 16 (App Router + TypeScript + Tailwind CSS)
│   ├── app/
│   │   ├── page.tsx          # Landing page
│   │   ├── setup/page.tsx    # 4-Step Academic Onboarding Wizard
│   │   └── workspace/[workspaceId]/page.tsx # Study Workspace Dashboard
│   ├── components/
│   │   ├── academic/         # Knowledge Map tree, Topic Drawer, Materials section
│   │   ├── forms/            # Wizard step forms (Student, Goal, Materials, Review)
│   │   ├── layout/           # Header, Footer, Step progress indicator
│   │   └── ui/               # Reusable design system primitives
│   ├── lib/api/              # Type-safe API client wrapper
│   └── types/                # TypeScript interface definitions
│
├── .gitignore
├── alembic.ini
└── README.md
```

---

## Tech Stack

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, Lucide Icons
- **Backend**: Python 3.12+, FastAPI, Pydantic v2, SQLAlchemy 2.0, Alembic, PyPDF
- **Database**: PostgreSQL (with SQLAlchemy connection/migration fallback support)
- **Styling**: Curated academic design system (Slate / Indigo / Zinc) with responsive mobile/desktop layouts

---

## Phase 1 Features

1. **Student & Academic Setup**:
   - Collects student identity, subject focus, and learning goals.
   - Dynamic validation for **Exam Preparation** (requires exam date) vs **Concept Mastery** (flexible self-pacing).
2. **Dual-Mode Syllabus Ingestion**:
   - **Option A (PDF Extraction)**: Upload official PDF syllabi with automatic parsing into structured units, chapters, and topics.
   - **Option B (Manual Builder)**: Interactive dynamic builder to create, rename, and organize units and topics.
3. **Canonical Prerequisite Knowledge Graph**:
   - Seeded with comprehensive Data Structures & Algorithms topic hierarchy.
   - Relational prerequisites (e.g. Graph Representation + Queues $\to$ BFS).
4. **Interactive Topic Detail Inspector**:
   - Slide-over drawer detailing foundational prerequisites, downstream dependent concepts, and subtopics.
5. **Academic Materials Management**:
   - Stores and links course syllabi and previous-year question papers (PYQs).
6. **Full Data Persistence**:
   - All workspaces, units, topics, materials, and prerequisite relationships are permanently stored in the database and survive browser reloads and service restarts.

---

## Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **Python**: v3.12.0 or higher (or [`uv`](https://github.com/astral-sh/uv))

---

### 1. Backend Setup

```bash
# Navigate to the project root and create a virtual environment
uv venv --python 3.12 backend/.venv
# or: python -m venv backend/.venv

# Activate virtual environment (Windows)
backend\.venv\Scripts\activate
# (macOS/Linux)
# source backend/.venv/bin/activate

# Install dependencies
uv pip install -r backend/requirements.txt
# or: pip install -r backend/requirements.txt

# Run database migrations
alembic upgrade head

# Start the FastAPI development server
uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```

- **API Documentation (Swagger UI)**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **Health Check**: [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health)

---

### 2. Frontend Setup

```bash
# In a new terminal, navigate to the frontend directory
cd frontend

# Install npm dependencies
npm install

# Start the Next.js development server
npm run dev
```

- **Web Application**: [http://localhost:3000](http://localhost:3000)

---

## API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/subjects` | Lists canonical and custom subjects |
| `POST` | `/api/syllabus/extract-pdf` | Uploads and extracts structured units from a syllabus PDF |
| `POST` | `/api/workspaces` | Creates and persists a study workspace with student, units, and topics |
| `GET` | `/api/workspaces/{id}` | Retrieves workspace overview statistics (days remaining, counts) |
| `GET` | `/api/workspaces/{id}/knowledge-map` | Retrieves full hierarchical Knowledge Map tree |
| `GET` | `/api/workspaces/{id}/topics/{topic_id}` | Retrieves topic details with relational prerequisites and dependents |
| `GET` | `/api/workspaces/{id}/materials` | Lists all academic materials and question papers |
| `POST` | `/api/workspaces/{id}/materials` | Uploads academic materials directly to an existing workspace |

---

## Project Changelog

### Phase 1 (Completed) — Academic Setup + Knowledge Foundation
- [x] Initialized FastAPI backend with service/repository architecture.
- [x] Built relational database models (`students`, `subjects`, `student_subjects`, `academic_materials`, `units`, `topics`, `syllabus_topics`, `prerequisites`).
- [x] Configured Alembic migrations and database seeders for canonical DSA knowledge graph.
- [x] Implemented PDF syllabus extraction and structured text parsing.
- [x] Built responsive Next.js 16 frontend with Tailwind CSS and custom academic design system.
- [x] Created 4-step onboarding wizard (`/setup`) with progress tracking and form validation.
- [x] Implemented Study Workspace Dashboard (`/workspace/[workspaceId]`) with Knowledge Map tree and Topic Detail Drawer.
- [x] Verified full workspace persistence across restarts and reloads.

---

## License

MIT © [LearnLoop](https://github.com/bhavyaofficial1946/LearnLoop)
