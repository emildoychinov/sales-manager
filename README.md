# Running the project with Docker

## Prerequisites

- Docker and Docker Compose installed
- Ports 5432, 6379, and 8000 free

## Initial run

1. **From the project root** (`softwareone/`):

   ```bash
   cd /home/emil/Desktop/training/softwareone
   docker compose up -d --build
   ```

   This will:
   - Build the backend image
   - Start Postgres (with database `salesdb`), Redis, and the FastAPI backend
   - Create tables on first backend startup

2. **Check that everything is up:**

   ```bash
   docker compose ps
   ```

   All services should be `running`. Backend may take a few seconds to become healthy while Postgres finishes starting.

3. **Verify the API:**

   - Health: http://localhost:8000/api/health → `{"status":"ok"}`
   - Swagger: http://localhost:8000/docs

## Useful commands

- **View backend logs:** `docker compose logs -f backend`
- **Stop:** `docker compose down`
- **Stop and remove database volume:** `docker compose down -v`

## Optional: local `.env`

To run the backend locally (outside Docker) against the same Postgres/Redis, copy `.env.example` to `backend/.env` and use:

- `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/salesdb`
- `REDIS_URL=redis://localhost:6379/0`

Then from `backend/`: `pip install -r requirements.txt && uvicorn app.main:app --reload`.
