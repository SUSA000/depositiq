from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.api import analytics, auth, dashboard, history, insights, predictions
from app.core.config import ALLOWED_ORIGINS, APP_NAME, PROJECT_ROOT
from app.core.database import init_db


@asynccontextmanager
async def lifespan(_app: FastAPI):
    init_db()
    yield


app = FastAPI(
    title=APP_NAME,
    description="Authenticated bank term-deposit prediction and analytics API.",
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(predictions.router)
app.include_router(dashboard.router)
app.include_router(insights.router)
app.include_router(analytics.router)
app.include_router(history.router)


FRONTEND_DIST = PROJECT_ROOT / "frontend" / "dist"
FRONTEND_ASSETS = FRONTEND_DIST / "assets"
if FRONTEND_ASSETS.exists():
    app.mount("/assets", StaticFiles(directory=FRONTEND_ASSETS), name="assets")


@app.get("/{full_path:path}", include_in_schema=False)
def serve_react_app(full_path: str):
    if full_path.startswith("api/"):
        raise HTTPException(status_code=404, detail="API endpoint not found.")
    if not FRONTEND_DIST.exists():
        if not full_path:
            return {
                "name": APP_NAME,
                "status": "API ready",
                "frontend": "Run the Vite development server on port 5173.",
            }
        raise HTTPException(status_code=404, detail="Frontend build not found.")

    requested = (FRONTEND_DIST / full_path).resolve()
    if requested.is_relative_to(FRONTEND_DIST.resolve()) and requested.is_file():
        return FileResponse(requested)
    return FileResponse(FRONTEND_DIST / "index.html")
