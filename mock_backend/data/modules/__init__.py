"""Module-scoped seed builders. Each returns a dict of store keys → values to merge."""
from __future__ import annotations

from typing import Any

from data.modules import admin as admin_mod
from data.modules import approvals as approvals_mod
from data.modules import my_work as my_work_mod
from data.modules import organization as organization_mod
from data.modules import payroll as payroll_mod
from data.modules import projects as projects_mod
from data.modules import sales as sales_mod
from data.modules import workforce as workforce_mod


def merge_module_seeds(data: dict[str, Any] | None = None) -> dict[str, Any]:
    """Merge module seeds into an existing store dict (later modules overwrite keys)."""
    out: dict[str, Any] = dict(data or {})
    out.update(admin_mod.build_seed())
    out.update(organization_mod.build_seed())
    out.update(my_work_mod.build_seed())
    out.update(sales_mod.build_seed())
    out.update(projects_mod.build_seed())
    out.update(workforce_mod.build_seed())
    out.update(payroll_mod.build_seed())
    out.update(approvals_mod.build_seed())
    return out


def build_all_seed() -> dict[str, Any]:
    """Fresh full store from all module seeds (used by seed.py)."""
    return merge_module_seeds({})
