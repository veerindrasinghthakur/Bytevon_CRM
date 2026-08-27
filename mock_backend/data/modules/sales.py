"""Sales module seed — leads, clients, case studies, activities (FE UI shape)."""
from __future__ import annotations
from typing import Any

def build_seed() -> dict[str, Any]:
    return {
        "leads": [
            {"id": "LD-1024", "title": "TechNexus ERP Migration", "contactName": "Sarah Miller", "contactTitle": "VP of Growth", "company": "TechNexus Corp.", "industry": "SaaS / Technology", "email": "s.miller@technexus.com", "phone": "+1 (555) 012-3456", "source": "LinkedIn", "priority": "Critical", "status": "Active", "stage": "Qualified", "budget": 120000, "probability": 65, "date": "2024-12-15", "assignedTo": "Alex Rivera", "tags": ["HOT LEAD", "ENTERPRISE"], "createdAt": "2024-10-01", "notes": "Demo focus on multi-entity consolidation.", "chatLink": "https://chat.bytevon.app/c/technexus-sarah"},
            {"id": "LD-1025", "title": "Global Logistics Audit", "contactName": "Jordan Lee", "company": "Global Logistics Ltd.", "industry": "Transportation", "source": "Referral", "priority": "Medium", "status": "Active", "stage": "New", "budget": 45000, "date": "2025-01-22", "tags": ["STRATEGIC"], "createdAt": "2024-10-10"},
            {"id": "LD-1026", "title": "Chen Fintech Rollout", "contactName": "Robert Chen", "company": "Chen Financial Group", "industry": "Fintech / Banking", "source": "Direct Referral", "priority": "High", "status": "Active", "stage": "Negotiation", "budget": 280000, "createdAt": "2024-09-20", "assignedTo": "Marcus Sterling"},
            {"id": "LD-1027", "title": "Cloud ERP Migration", "contactName": "Jonathan Smith", "company": "Starlight Tech", "email": "j.smith@starlight.com", "source": "LinkedIn", "priority": "High", "status": "Active", "stage": "Negotiation", "budget": 120000, "createdAt": "2024-10-12", "assignedTo": "Sarah Chen"},
            {"id": "LD-1028", "title": "Mobile POS System", "contactName": "Maria Benson", "company": "Cloud9 Systems", "source": "Website", "priority": "Medium", "status": "Inactive", "stage": "Proposal", "budget": 45000, "createdAt": "2024-10-13", "assignedTo": "Alex Rivera"},
            {"id": "LD-1029", "title": "Clinic Portal Pilot", "contactName": "Dr. Laila Nassar", "company": "HealthBridge Clinics", "industry": "Healthcare", "source": "Event", "priority": "High", "status": "Active", "stage": "Contacted", "budget": 62000, "createdAt": "2026-08-02", "assignedTo": "Alex Rivera"},
            {"id": "LD-1030", "title": "Retail POS Integration", "contactName": "Tom Hale", "company": "Northwind Retail", "source": "Other", "priority": "Low", "status": "Inactive", "stage": "Lost", "budget": 30000, "createdAt": "2025-12-01", "assignedTo": "Marcus Sterling"},
            {"id": "LD-1031", "title": "ERP Expansion Won", "contactName": "James Wong", "company": "TechNexus Corp.", "source": "Referral", "priority": "Critical", "status": "Active", "stage": "Won", "budget": 180000, "probability": 100, "createdAt": "2026-02-01", "assignedTo": "Marcus Sterling"},
        ],
        "clients": [
            {"id": "c1", "name": "NexTech Solutions", "legalName": "NexTech Solutions, Inc.", "type": "Enterprise", "status": "Active", "industry": "Technology", "country": "United States", "email": "contact@nextech.com", "phone": "+1 (555) 012-3456", "primaryContact": "Sarah Jenkins", "projects": 12, "leads": 4, "logoInitials": "NK"},
            {"id": "c2", "name": "CloudScale Inc.", "type": "SMB", "status": "Active", "industry": "Cloud Infrastructure", "country": "Canada", "email": "billing@cloudscale.io", "projects": 3, "leads": 8, "logoInitials": "CS"},
            {"id": "c3", "name": "Altair Ventures", "type": "Partner", "status": "Inactive", "industry": "Venture Capital", "country": "Germany", "projects": 0, "leads": 1, "logoInitials": "AV"},
            {"id": "c4", "name": "Nexus Global Holdings", "type": "Enterprise", "status": "Active", "industry": "Technology", "country": "United States", "projects": 12, "leads": 4, "logoInitials": "NG", "clientSince": "Jan 2022"},
            {"id": "c5", "name": "TechNexus Corp.", "type": "Enterprise", "status": "Active", "industry": "Technology", "country": "United States", "primaryContact": "James Wong", "projects": 2, "leads": 2, "logoInitials": "TN"},
            {"id": "c6", "name": "Global Logistics Ltd.", "type": "SMB", "status": "Active", "industry": "Logistics", "country": "United Kingdom", "primaryContact": "Anna Berg", "projects": 1, "leads": 1, "logoInitials": "GL"},
        ],
        "case_studies": [
            {"id": "cs1", "title": "TechNexus ERP Migration", "customer": "TechNexus Corp", "industry": "SaaS", "status": "Published", "impact": "40% efficiency gain", "revenue": "$1.2M", "tags": ["ERP", "Cloud", "Migration"]},
            {"id": "cs2", "title": "Global Logistics Optimization", "customer": "SwiftFlow Ltd", "industry": "Logistics", "status": "Draft", "impact": "15% Cost reduction", "revenue": "$850k", "tags": ["SCM", "AI"]},
            {"id": "cs3", "title": "Zenith Bank Digital Core", "customer": "Zenith Group", "industry": "Finance", "status": "Published", "impact": "Zero downtime update", "revenue": "$2.1M", "tags": ["Banking", "Fintech"]},
        ],
        "sales_activities": [
            {"id": "a1", "type": "Lead Created", "title": "Lead Created", "body": "New high-potential lead from APAC summit.", "actor": "Sarah Jenkins", "time": "10:45 AM", "dateGroup": "Today", "tag": "LEAD"},
            {"id": "a2", "type": "Lead Won", "title": "Lead Won", "body": "Closed multi-year ERP migration contract.", "actor": "Alex Rivera", "time": "09:12 AM", "dateGroup": "Today", "tag": "CLIENT"},
            {"id": "a3", "type": "Meeting Scheduled", "title": "Meeting Scheduled", "body": "Discovery call with FinTech Solutions CTO.", "actor": "Marcus Thorne", "time": "04:30 PM", "dateGroup": "Yesterday", "tag": "MEETING"},
        ],
        "sales_reps_fallback": [
            {"employmentId": 1, "name": "Alex Rivera", "employeeCode": "SALES-1", "department": "Sales"},
            {"employmentId": 2, "name": "Marcus Sterling", "employeeCode": "SALES-2", "department": "Sales"},
            {"employmentId": 3, "name": "Sarah Chen", "employeeCode": "SALES-3", "department": "Sales"},
        ],
    }
