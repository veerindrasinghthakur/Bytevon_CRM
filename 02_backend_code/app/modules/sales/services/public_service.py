"""
SalesPublicService — compatibility re-export.

Prefer domain services:
  app.modules.sales.domains.lead.service.LeadService
  app.modules.sales.domains.client.service.ClientService
  app.modules.sales.domains.platform.service.PlatformService

Or the thin UI facade at app.modules.sales.dependencies.SalesPublicService.
"""
from app.modules.sales.dependencies import SalesPublicService

__all__ = ["SalesPublicService"]
