"""Projects module seed - projects, teams, tasks, employees (for team members)."""
from __future__ import annotations
from typing import Any

def build_seed() -> dict[str, Any]:
    return {
        "projects": [
            {"id": 1024, "name": "ERP Migration Phase 2", "code": "PRJ-1024", "status": "IN_PROGRESS", "clientId": 1, "clientName": "TechNexus Corp.", "startDate": "2026-01-15", "endDate": "2026-12-15", "progress": 65, "teamCount": 4, "taskCount": 5, "teamId": 1, "description": "Infrastructure upgrade and data migration.", "repositoryUrl": "https://github.com/example/erp", "createdAt": "2026-01-10T10:00:00Z", "updatedAt": "2026-08-07T14:30:00Z"},
            {"id": 1025, "name": "Global Logistics Audit", "code": "PRJ-1025", "status": "PLANNING", "clientId": 2, "clientName": "Global Logistics Ltd.", "startDate": "2026-09-01", "endDate": "2027-01-22", "progress": 0, "teamCount": 2, "taskCount": 2, "teamId": None, "description": "Consulting audit for logistics.", "repositoryUrl": None, "createdAt": "2026-07-20T09:00:00Z", "updatedAt": "2026-08-01T11:00:00Z"},
            {"id": 1026, "name": "Fintech Rollout V3", "code": "PRJ-1026", "status": "ON_HOLD", "clientId": 3, "clientName": "Chen Financial Group", "startDate": "2026-03-01", "endDate": "2026-11-08", "progress": 82, "teamCount": 5, "taskCount": 3, "teamId": 1, "description": "Fintech product rollout.", "repositoryUrl": None, "createdAt": "2026-02-15T08:00:00Z", "updatedAt": "2026-05-12T16:00:00Z"},
            {"id": 1027, "name": "Bytevon CRM Core", "code": "PRJ-1027", "status": "IN_PROGRESS", "clientId": None, "clientName": "Internal", "startDate": "2026-01-15", "endDate": "2026-09-30", "progress": 42, "teamCount": 4, "taskCount": 6, "teamId": 1, "description": "Core ERP/CRM platform.", "repositoryUrl": "https://github.com/veerindrasinghthakur/bytevon_documentation", "createdAt": "2026-01-10T10:00:00Z", "updatedAt": "2026-08-07T14:30:00Z"},
            {"id": 1028, "name": "Client Portal", "code": "PRJ-1028", "status": "IN_PROGRESS", "clientId": 1, "clientName": "TechNexus Corp.", "startDate": "2026-04-01", "endDate": "2026-10-31", "progress": 35, "teamCount": 3, "taskCount": 4, "teamId": 3, "description": "External client self-service portal.", "repositoryUrl": None, "createdAt": "2026-03-20T10:00:00Z", "updatedAt": "2026-08-10T09:00:00Z"},
            {"id": 1029, "name": "Mobile Attendance", "code": "PRJ-1029", "status": "PLANNING", "clientId": None, "clientName": "Internal", "startDate": "2026-08-01", "endDate": "2026-12-01", "progress": 10, "teamCount": 2, "taskCount": 3, "teamId": 4, "description": "Mobile-first attendance experience.", "repositoryUrl": None, "createdAt": "2026-07-01T08:00:00Z", "updatedAt": "2026-08-05T12:00:00Z"},
        ],
        "teams": [
            {"id": 1, "name": "Alpha Engineering", "description": "Core backend and API team.", "department": "Engineering", "headName": "Sarah Jenkins", "headRole": "Tech Lead", "projectName": "Bytevon CRM Core", "memberCount": 12, "projectCount": 4, "status": "ACTIVE", "createdAt": "2026-02-01T10:00:00Z"},
            {"id": 2, "name": "Brand Creative", "description": "UI/UX and design system", "department": "Design", "headName": "David Chen", "headRole": "Design Director", "projectName": "Client Portal", "memberCount": 8, "projectCount": 2, "status": "ACTIVE", "createdAt": "2026-03-15T09:00:00Z"},
            {"id": 3, "name": "Client Portal Squad", "description": "External portal delivery", "department": "Engineering", "headName": "Marcus Sterling", "headRole": "Project Lead", "projectName": "Client Portal", "memberCount": 4, "projectCount": 1, "status": "ACTIVE", "createdAt": "2026-07-01T11:00:00Z"},
            {"id": 4, "name": "Mobile Ops", "description": "Attendance mobile app", "department": "Engineering", "headName": "Elena R.", "headRole": "Mobile Lead", "projectName": "Mobile Attendance", "memberCount": 2, "projectCount": 1, "status": "INACTIVE", "createdAt": "2026-04-10T08:00:00Z"},
            {"id": 5, "name": "Platform QA", "description": "Cross-product quality", "department": "Engineering", "headName": "Priya K.", "headRole": "QA Lead", "projectName": "Bytevon CRM Core", "memberCount": 5, "projectCount": 3, "status": "ACTIVE", "createdAt": "2026-05-01T10:00:00Z"},
            {"id": 6, "name": "Sales Enablement", "description": "Sales tooling", "department": "Sales", "headName": "Alex Morgan", "headRole": "Account Executive", "projectName": None, "memberCount": 3, "projectCount": 0, "status": "ACTIVE", "createdAt": "2026-06-15T09:00:00Z"},
        ],
        "tasks": [
            {"id": 1, "title": "Implement AppShell layout", "description": "Icon rail + secondary sidebar", "priority": "HIGH", "status": "DONE", "projectId": 1027, "projectName": "Bytevon CRM Core", "assigneeName": "Virendra", "dueDate": "2026-08-05", "createdAt": "2026-07-20T10:00:00Z"},
            {"id": 2, "title": "Projects list & detail pages", "description": "List, detail, create form", "priority": "HIGH", "status": "IN_PROGRESS", "projectId": 1027, "projectName": "Bytevon CRM Core", "assigneeName": "Virendra", "dueDate": "2026-08-10", "createdAt": "2026-07-22T11:00:00Z"},
            {"id": 3, "title": "Wire Teams module to API", "description": "Replace mock with backend", "priority": "MEDIUM", "status": "TODO", "projectId": 1027, "projectName": "Bytevon CRM Core", "assigneeName": None, "dueDate": "2026-08-20", "createdAt": "2026-08-01T09:00:00Z"},
            {"id": 4, "title": "Client portal auth flow", "description": "Login for external clients", "priority": "HIGH", "status": "TODO", "projectId": 1028, "projectName": "Client Portal", "assigneeName": "Design team", "dueDate": "2026-09-15", "createdAt": "2026-07-28T14:00:00Z"},
            {"id": 5, "title": "Attendance check-in UI", "description": "Mobile mark attendance", "priority": "URGENT", "status": "BLOCKED", "projectId": 1029, "projectName": "Mobile Attendance", "assigneeName": "Mobile Ops", "dueDate": "2026-09-01", "createdAt": "2026-04-15T08:00:00Z"},
            {"id": 6, "title": "Design system tokens audit", "description": "CSS variables audit", "priority": "LOW", "status": "IN_REVIEW", "projectId": 1027, "projectName": "Bytevon CRM Core", "assigneeName": "Beta Design", "dueDate": "2026-08-12", "createdAt": "2026-08-02T16:00:00Z"},
            {"id": 7, "title": "ERP data mapping workbook", "description": "Legacy to CRM schema", "priority": "HIGH", "status": "IN_PROGRESS", "projectId": 1024, "projectName": "ERP Migration Phase 2", "assigneeName": "Sarah Jenkins", "dueDate": "2026-08-25", "createdAt": "2026-07-01T10:00:00Z"},
            {"id": 8, "title": "Logistics site visit plan", "description": "Warehouse walkthroughs", "priority": "MEDIUM", "status": "TODO", "projectId": 1025, "projectName": "Global Logistics Audit", "assigneeName": "Admin User", "dueDate": "2026-09-10", "createdAt": "2026-08-01T09:00:00Z"},
            {"id": 9, "title": "Fintech compliance checklist", "description": "Regulatory items V3", "priority": "HIGH", "status": "ON_HOLD", "projectId": 1026, "projectName": "Fintech Rollout V3", "assigneeName": "Marcus Sterling", "dueDate": "2026-10-01", "createdAt": "2026-04-01T11:00:00Z"},
            {"id": 10, "title": "Portal dashboard widgets", "description": "Client summary cards", "priority": "MEDIUM", "status": "IN_PROGRESS", "projectId": 1028, "projectName": "Client Portal", "assigneeName": "David Chen", "dueDate": "2026-08-30", "createdAt": "2026-07-15T10:00:00Z"},
            {"id": 11, "title": "Leave balance sync", "description": "Sync leave to mobile", "priority": "MEDIUM", "status": "TODO", "projectId": 1029, "projectName": "Mobile Attendance", "assigneeName": "Elena R.", "dueDate": "2026-09-20", "createdAt": "2026-08-03T08:00:00Z"},
            {"id": 12, "title": "Notification preferences API", "description": "IN_APP and EMAIL channels", "priority": "LOW", "status": "TODO", "projectId": 1027, "projectName": "Bytevon CRM Core", "assigneeName": "Priya K.", "dueDate": "2026-08-28", "createdAt": "2026-08-08T10:00:00Z"},
        ],
        "project_documents": [
            {"id": "doc-1", "name": "ERP Scope Document.pdf", "projectId": 1024, "type": "PDF", "size": "2.4 MB", "uploadedBy": "Sarah Jenkins", "uploadedAt": "2026-07-01"},
            {"id": "doc-2", "name": "Architecture Diagram.png", "projectId": 1027, "type": "Image", "size": "840 KB", "uploadedBy": "Marcus Sterling", "uploadedAt": "2026-08-01"},
        ],
        "project_notes": [
            {"id": "note-1", "projectId": 1027, "body": "Kickoff complete - AppShell and router split done.", "author": "Virendra", "createdAt": "2026-08-07T12:00:00Z"},
            {"id": "note-2", "projectId": 1024, "body": "Client confirmed multi-entity consolidation priority.", "author": "Sarah Jenkins", "createdAt": "2026-07-15T10:00:00Z"},
        ],
        "project_employees": [
            {"id": 1, "fullName": "Admin User", "email": "admin@bytevon.example", "department": "Operations", "role": "Administrator", "status": "ACTIVE", "joiningDate": "2020-01-15"},
            {"id": 2, "fullName": "Sarah Jenkins", "email": "sarah.j@bytevon.example", "department": "Engineering", "role": "Tech Lead", "status": "ACTIVE", "joiningDate": "2021-03-01"},
            {"id": 3, "fullName": "David Chen", "email": "david.c@bytevon.example", "department": "Design", "role": "Design Director", "status": "ACTIVE", "joiningDate": "2019-08-12"},
            {"id": 4, "fullName": "Marcus Sterling", "email": "marcus@bytevon.example", "department": "Engineering", "role": "Project Lead", "status": "ACTIVE", "joiningDate": "2022-01-10"},
            {"id": 5, "fullName": "Elena R.", "email": "elena.r@bytevon.example", "department": "Engineering", "role": "Mobile Lead", "status": "ACTIVE", "joiningDate": "2023-04-20"},
            {"id": 6, "fullName": "Priya K.", "email": "priya.k@bytevon.example", "department": "Engineering", "role": "Engineer", "status": "ACTIVE", "joiningDate": "2024-02-01"},
            {"id": 7, "fullName": "Alex Morgan", "email": "alex.m@bytevon.example", "department": "Sales", "role": "Account Executive", "status": "ACTIVE", "joiningDate": "2023-11-01"},
            {"id": 8, "fullName": "Jordan Lee", "email": "jordan.l@bytevon.example", "department": "Design", "role": "Product Designer", "status": "ON_LEAVE", "joiningDate": "2022-07-15"},
        ],
    }
