# CDB

College basketball stats tracker with a FastAPI + Postgres backend and a Vite + React frontend. It supports box scores, player pages, analytics, and role-based admin controls.

## Stack
- Backend: FastAPI, psycopg, Postgres (Neon)
- Frontend: React, Vite, TypeScript

## Local setup
Backend:
1) Create and activate a virtualenv.
2) Install deps:
   - `pip install -r requirements.txt`
3) Set environment variables:
   - `DATABASE_URL="postgresql://USER:PASSWORD@HOST/DB?sslmode=require&channel_binding=require"`
   - `CORS_ORIGINS="http://localhost:5173"`
4) Run migrations:
   - `python3 scripts/migrate.py`
5) Start the API:
   - `uvicorn main:app --reload`

Frontend:
1) `cd frontend`
2) `npm install`
3) Set environment variables:
   - `VITE_API_BASE_URL="http://localhost:8000"`
4) Start the app:
   - `npm run dev`

## Demo credentials
- recruiter / seemyproject

If you fork or deploy, change the demo password.

## Database notes
- Migrations live in `app/db/migrations.py`
- The `scripts/create_user.py` helper inserts users directly into the DB.

## Deployment
- Backend: Render with `DATABASE_URL` and `CORS_ORIGINS` set.
- Frontend: Vercel with `VITE_API_BASE_URL` set to your Render API URL.
