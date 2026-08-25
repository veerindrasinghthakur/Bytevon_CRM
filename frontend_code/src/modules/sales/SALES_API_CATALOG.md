# Sales API Catalog

Base: `/api/v1` · FE: `modules/sales/api/sales.ts` · BE: `mock_backend/routes/sales.py`

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/sales/leads` | List leads (+ metrics) |
| GET | `/sales/leads/filter-options` | Status / stage / priority / source options |
| GET | `/sales/leads/{id}` | Lead detail |
| POST | `/sales/leads` | Create lead |
| PATCH | `/sales/leads/{id}` | Update lead |
| GET | `/sales/clients` | List clients (+ metrics) |
| GET | `/sales/clients/filter-options` | Status / type / industry / country |
| GET | `/sales/clients/{id}` | Client detail |
| POST | `/sales/clients` | Create client |
| PATCH | `/sales/clients/{id}` | Update client |
| GET | `/sales/case-studies` | Case studies list |
| GET | `/sales/case-studies/filter-options` | Status / industry |
| GET | `/sales/activities` | Activity timeline |
| GET | `/sales/metrics/dashboard` | Dashboard KPI cards |
| GET | `/sales/metrics/leads` | Lead metrics |
| GET | `/sales/metrics/clients` | Client metrics |
| GET | `/sales/sales-representatives` | Employees in **Sales** department (rep picker) |

## Sales representative picker

`GET /sales/sales-representatives` returns employments with a current assignment to the department named `Sales`.

Lead create/edit stores `assignedEmploymentId` + resolved `assignedTo` name.

## Filter options

Loaded once on list/create page mount (`staleTime` 60s). Options merge data-derived values with canonical enums so empty stores still show full dropdowns.

Last updated: 2026-08-25
