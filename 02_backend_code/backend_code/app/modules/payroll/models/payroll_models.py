"""
Payroll ORM models.

Tables:
  employee_salary, employee_salary_items,
  monthly_payroll, monthly_payroll_items,
  employee_bank_accounts
"""

from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from typing import List, Optional

from sqlalchemy import (
    Boolean,
    Date,
    ForeignKey,
    Integer,
    Numeric,
    SmallInteger,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.base import (
    Base,
    EffectiveDatingMixin,
    IdentityMixin,
    TimestampMixin,
)
from app.core.db.enums import PayrollItemType, PayrollStatus, SalaryItemType


class EmployeeSalary(Base, IdentityMixin, EffectiveDatingMixin, TimestampMixin):
    """Versioned salary configuration. Never overwrite; close + insert."""

    __tablename__ = "employee_salary"

    employment_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("employments.id"), nullable=False, index=True
    )
    gross_salary: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    changed_by: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    items: Mapped[List["EmployeeSalaryItem"]] = relationship(
        "EmployeeSalaryItem",
        back_populates="employee_salary",
        cascade="all, delete-orphan",
    )


class EmployeeSalaryItem(Base, IdentityMixin, TimestampMixin):
    __tablename__ = "employee_salary_items"

    employee_salary_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("employee_salary.id"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    type: Mapped[SalaryItemType] = mapped_column(nullable=False)
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    changed_by: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    employee_salary: Mapped["EmployeeSalary"] = relationship(
        "EmployeeSalary", back_populates="items"
    )


class MonthlyPayroll(Base, IdentityMixin, TimestampMixin):
    __tablename__ = "monthly_payroll"
    __table_args__ = (
        UniqueConstraint(
            "employment_id",
            "year",
            "month",
            name="uq_monthly_payroll_emp_year_month",
        ),
    )

    employment_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("employments.id"), nullable=False, index=True
    )
    year: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    month: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    gross_salary: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    total_earnings: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    total_deductions: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    net_salary: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    status: Mapped[PayrollStatus] = mapped_column(nullable=False)
    payment_method: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    payment_reference: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)
    payment_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    payable_days: Mapped[Optional[Decimal]] = mapped_column(Numeric(5, 2), nullable=True)
    lop_days: Mapped[Optional[Decimal]] = mapped_column(Numeric(5, 2), nullable=True)
    changed_by: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    items: Mapped[List["MonthlyPayrollItem"]] = relationship(
        "MonthlyPayrollItem",
        back_populates="monthly_payroll",
        cascade="all, delete-orphan",
    )


class MonthlyPayrollItem(Base, IdentityMixin):
    __tablename__ = "monthly_payroll_items"

    monthly_payroll_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("monthly_payroll.id"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    type: Mapped[PayrollItemType] = mapped_column(nullable=False)
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    monthly_payroll: Mapped["MonthlyPayroll"] = relationship(
        "MonthlyPayroll", back_populates="items"
    )


class EmployeeBankAccount(Base, IdentityMixin, TimestampMixin):
    __tablename__ = "employee_bank_accounts"

    employment_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("employments.id"), nullable=False, index=True
    )
    account_holder_name: Mapped[str] = mapped_column(String(255), nullable=False)
    bank_name: Mapped[str] = mapped_column(String(255), nullable=False)
    account_number: Mapped[str] = mapped_column(String(100), nullable=False)
    ifsc_code: Mapped[str] = mapped_column(String(20), nullable=False)
    account_type: Mapped[str] = mapped_column(String(50), nullable=False)
    is_primary: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default="false"
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True, server_default="true"
    )
    changed_by: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
