"""ByteVon CRM FastAPI entrypoint."""

from fastapi import FastAPI

from app.api.router import api_router
from app.core.config import settings
from app.core.exceptions.handlers import register_exception_handlers
from app.core.lifespan import lifespan
from app.core.middleware.logging import RequestLoggingMiddleware

app = FastAPI(
    title=settings.APP_NAME,
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(RequestLoggingMiddleware)
register_exception_handlers(app)
app.include_router(api_router, prefix="/api/v1")


@app.get("/health")
async def health():
    return {"status": "ok", "app": settings.APP_NAME}
