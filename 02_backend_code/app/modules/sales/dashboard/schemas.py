"""Dashboard / analytics schemas."""
from __future__ import annotations

from pydantic import BaseModel


class DashboardMetric(BaseModel):
    id: str
    label: str
    value: str


class DashboardMetrics(BaseModel):
    metrics: list[DashboardMetric]


class AnalyticsResponse(BaseModel):
    metrics: list[DashboardMetric]
