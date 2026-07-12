from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
# Must be first: registers all models with SQLAlchemy so cross-model
# relationship strings like "Location", "User", "Employee" resolve correctly.
import app.models.registry  # noqa: F401
from app.api.v1.auth import router as auth_router
from app.api.v1.assets import router as assets_router
from app.api.v1.operations import router as operations_router
from app.api.v1.bookings import router as bookings_router

app = FastAPI(
    title="AssetFlow ERP API",
    description="Identity Management & Asset Lifecycle Tracking Layer",
    version="1.0.0"
)

# Enable CORS for local client and future production endpoints
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, replace with specific domain origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount core routers
app.include_router(auth_router, prefix="/api/v1")
app.include_router(assets_router, prefix="/api/v1")
app.include_router(operations_router, prefix="/api/v1")
app.include_router(bookings_router, prefix="/api/v1")

@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "AssetFlow API Gateway",
        "documentation": "/docs"
    }
