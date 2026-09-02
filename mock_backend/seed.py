"""
Generate demo store by merging module seeds.
Run from mock_backend/:  python seed.py
"""
from __future__ import annotations

import sys
from pathlib import Path

# Ensure package imports resolve when run as script
ROOT = Path(__file__).resolve().parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from data.modules import build_all_seed
from store import STORE_PATH, save


def main() -> None:
    data = build_all_seed()
    save(data)
    print(f"Seed written to {STORE_PATH}")
    print(
        f"  users={len(data.get('admin_users', []))} roles={len(data.get('roles', []))} "
        f"audit={len(data.get('audit_logs', []))} departments={len(data.get('departments', []))}"
    )
    print(
        f"  my_work leave={len(data.get('my_work_leave_requests', []))} "
        f"attendance={len(data.get('my_work_attendance', []))} "
        f"tasks={len(data.get('my_work_tasks', []))}"
    )
    print(
        f"  sales leads={len(data.get('leads', []))} clients={len(data.get('clients', []))} "
        f"case_studies={len(data.get('case_studies', []))}"
    )
    print(
        f"  projects={len(data.get('projects', []))} teams={len(data.get('teams', []))} "
        f"tasks={len(data.get('tasks', []))}"
    )
    print(
        f"  workforce today_att={len(data.get('workforce_today_attendance', []))} "
        f"corrections={len(data.get('workforce_attendance_corrections', []))} "
        f"employments={len(data.get('employments', []))}"
    )
    print(
        f"  payroll employees={len(data.get('payroll_employees', []))} "
        f"structures={len(data.get('payroll_salary_structures', {}) or {})}"
    )
    print(
        f"  approvals pending={len(data.get('approval_pending', []))} "
        f"my_requests={len(data.get('approval_my_requests', []))}"
    )
    print("  Login: admin@bytevon.local / ChangeMeAdmin!123")


if __name__ == "__main__":
    main()
