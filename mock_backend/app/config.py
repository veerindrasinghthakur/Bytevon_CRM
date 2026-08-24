from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SEED_DIR = ROOT / "data" / "seed"
STORE_DIR = ROOT / "data" / "store"
STORE_DIR.mkdir(parents=True, exist_ok=True)

DEFAULT_MOCK_USER_ID = 1
CORS_ORIGINS = ["*"]
