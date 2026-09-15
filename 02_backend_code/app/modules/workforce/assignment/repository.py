"""Assignment repository — reuses employee repo helpers."""
from __future__ import annotations

from app.modules.workforce.employee.repository import EmployeeRepository


class AssignmentRepository(EmployeeRepository):
    """Same data access as EmployeeRepository (shared employment tables)."""
