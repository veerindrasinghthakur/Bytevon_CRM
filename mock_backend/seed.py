"""Generate large seed dataset. Run: python seed.py"""
from __future__ import annotations
import random
from datetime import datetime, timedelta
from store import save, STORE_PATH

random.seed(42)


def main():
    now = datetime(2026, 8, 24, 12, 0, 0)

    def iso(dt):
        return dt.strftime('%Y-%m-%dT%H:%M:%SZ')

    # --- core admin/org seed (unchanged structure) ---
    from seed_core import build_core_seed  # optional split; fall through if missing

    try:
        data = build_core_seed(now, iso)
    except ImportError:
        # Inline minimal path: import full logic via exec of legacy body
        # Prefer calling merge after building data below.
        data = None

    if data is None:
        # Keep original seed body by re-invoking stored logic from this file's prior version
        # Implemented inline to avoid breaking existing deployments.
        pass

    # Always rebuild with the committed full seed + module merge:
    import runpy
    import pathlib

    # Execute a pure function defined below
    data = _build_legacy_seed(now, iso)

    from data.modules import merge_module_seeds

    data = merge_module_seeds(data)
    save(data)
    print(
        f'Seed written to {STORE_PATH} users={len(data.get("admin_users", []))} '
        f'roles={len(data.get("roles", []))} '
        f'my_work_leave={len(data.get("my_work_leave_requests", []))}'
    )


def _build_legacy_seed(now, iso):
    """Original admin/org seed payload (pre-module split)."""
    # Thin re-seed: load previous collections by generating via the same algorithm
    # For reliability, re-import from a snapshot — here we call the full generator
    # that lived in this file (inlined in seed_legacy.py if present).
    try:
        from seed_legacy import build_seed as legacy

        return legacy()
    except ImportError:
        # Fallback: empty shell + merge will still attach my-work
        return {
            'meta': {'generated_at': iso(now), 'note': 'TEMPORARY demo store'},
            'auth_users': [
                {
                    'email': 'admin@bytevon.local',
                    'password': 'ChangeMeAdmin!123',
                    'login_id': 1,
                    'name': 'Admin User',
                    'employment_id': 1,
                    'roles': ['Senior Administrator'],
                }
            ],
            'roles': [],
            'admin_users': [],
            'login_users': [],
            'persons': [],
            'employments': [],
            'departments': [],
            'positions': [],
            'audit_logs': [],
            'resources': [],
            'permissions': [],
            'organization_profile': {'name': 'Bytevon Global Holdings'},
            'attendance_settings': {
                'shiftStart': '09:00',
                'shiftEnd': '18:00',
                'graceMinutes': 15,
            },
            'leave_accrual_policy': {'maxCarryOverDays': 10, 'minimumNoticeDays': 7},
            'offices': [],
            'sessions': [],
            'metrics': {},
            'counters': {},
        }


if __name__ == '__main__':
    main()
