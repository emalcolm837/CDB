from contextlib import asynccontextmanager
from fastapi import FastAPI
from app.api.players import router as players_router
from app.api.games import router as games_router
from app.api.stats import router as stats_router
from app.api.analytics import router as analytics_router
from app.db.connect import get_connection
from app.db.schema import init_db
from app.api.auth import router as auth_router
from fastapi.middleware.cors import CORSMiddleware

@asynccontextmanager
async def lifespan(_app: FastAPI):
    conn = get_connection()
    init_db(conn)
    conn.close()
    yield

app = FastAPI(
    title="CDB API",
    description="Club Database REST API",
    version="1.0.0",
    lifespan=lifespan,
)

app.include_router(players_router)
app.include_router(games_router)
app.include_router(stats_router)
app.include_router(analytics_router)
app.include_router(auth_router)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
