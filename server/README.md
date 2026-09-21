# Nexora Server

FastAPI asynchronous backend for **Nexora**, orchestrating multi-agent workflows using **LangGraph**, **pgvector**, and **LangSmith**.

For full project architecture, system diagrams, and detailed instructions, refer to the [Root README](../README.md).

## Quick Start

### 1. Prerequisites
- Python 3.11
- [uv](https://github.com/astral-sh/uv)
- PostgreSQL with `pgvector`

### 2. Install Dependencies
```bash
uv sync
```

### 3. Configure Environment
Copy and populate `.env`:
```bash
cp .env.example .env # or configure values as described in Root README
```

### 4. Run Migrations
```bash
uv run alembic upgrade head
```

### 5. Start Development Server
```bash
uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Interactive API documentation will be available at [http://localhost:8000/docs](http://localhost:8000/docs).

### 6. Run Tests
```bash
uv run pytest
```
