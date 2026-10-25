"""Database initialization script for ByteVon CRM.

Applies Alembic migrations, runs bootstrap seed, and runs demo test data seed.
Can be executed directly via Python:
    cd 02_backend_code
    python -m scripts.init_db
"""
from __future__ import annotations

import asyncio
import logging
import os
import sys
from pathlib import Path

from alembic import command
from alembic.config import Config

from scripts.seed_bootstrap import seed as seed_bootstrap
from scripts.seed_test_data import seed as seed_test_data

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("init_db")


def run_migrations() -> None:
    logger.info("[1/3] Running Alembic migrations (alembic upgrade head)...")
    ini_path = Path(__file__).resolve().parent.parent / "alembic.ini"
    alembic_cfg = Config(str(ini_path))
    command.upgrade(alembic_cfg, "head")
    logger.info("[1/3] Alembic migrations completed successfully.")


async def run_seeds() -> None:
    logger.info("[2/3] Running bootstrap seed...")
    await seed_bootstrap()
    logger.info("[2/3] Bootstrap seed completed.")

    logger.info("[3/3] Running demo test data seed...")
    await seed_test_data()
    logger.info("[3/3] Demo test data seed completed.")


def main() -> None:
    try:
        run_migrations()
        asyncio.run(run_seeds())
        logger.info("Complete database initialization finished successfully.")
    except Exception:
        logger.exception("Database initialization failed.")
        sys.exit(1)


if __name__ == "__main__":
    main()
