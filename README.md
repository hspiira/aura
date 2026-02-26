# Aura

Enterprise Performance Management (EPM) API. Aligns objectives to strategy, combines quantitative and behavioral evaluation with calibration, and enforces a full audit trail.

## Setup

- **Python**: 3.12+
- **Package manager**: [uv](https://docs.astral.sh/uv/)

```bash
uv sync
cp .env.example .env   # edit as needed
```

## Run

```bash
uv run uvicorn app.main:app --reload
```

- API: http://localhost:8000/api/v1
- Docs: http://localhost:8000/api/v1/docs
- OpenAPI: http://localhost:8000/api/v1/openapi.json

## Commands

- `make test` — run tests (excluding DB-dependent)
- `make test-all` — run all tests (requires `DATABASE_URL`)
- `make audit-deps` — run pip-audit
- Create DB (once): `createdb aura` (or `psql -c "CREATE DATABASE aura;"`)
- `uv run alembic upgrade head` — run DB migrations (requires `DATABASE_URL`)

## Deploy (Vercel)

Configure the project in Vercel with framework **FastAPI**. The repo root contains `vercel.json` and `app/index.py` as the serverless entrypoint. Set environment variables in the Vercel project (e.g. from `.env.example`).

## License

Apache-2.0. See [LICENSE](LICENSE).
