"""Position model lives in workforce; re-export for admin domain consumers."""
from app.modules.workforce.models import Position

__all__ = ["Position"]
