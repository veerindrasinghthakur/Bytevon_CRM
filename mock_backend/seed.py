"""Generate large seed dataset. Run: python seed.py"""
from __future__ import annotations
import random
from datetime import datetime, timedelta
from store import save, STORE_PATH
random.seed(42)
# NOTE: Full generator lives in project artifacts/mock_backend/seed.py
# This GitHub copy is a thin wrapper that embeds the same seed logic via import path.
# Prefer copying artifacts/mock_backend entirely when developing.

def main():
    from pathlib import Path
    # If full seed module was replaced incompletely, regenerate minimal store
    now = datetime(2026, 8, 24, 12, 0, 0)
    def iso(dt):
        return dt.strftime('%Y-%m-%dT%H:%M:%SZ')
    roles = [
        {'id': f'R-{i:02d}', 'name': n, 'description': n, 'usersCount': 0,
         'permissions': p, 'status': 'Active', 'category': c, 'coveragePct': pct,
         'coverageLabel': lab, 'created': 'Jan 01, 2024', 'updated': 'just now'}
        for i, (n, c, pct, lab, p) in enumerate([
            ('Senior Administrator', 'Core Role', 100, 'Full Access', ['users.manage', 'roles.manage']),
            ('Sales Manager', 'Operational', 66, '12/18 Modules', ['leads.manage']),
            ('Junior Accountant', 'Financial', 28, '5/18 Modules', ['expenses.submit']),
            ('HR Manager', 'Operational', 55, '10/18 Modules', ['employees.read', 'leave.manage']),
            ('Finance Lead', 'Financial', 40, '7/18 Modules', ['expenses.approve']),
            ('Employee', 'Standard', 15, '3/18 Modules', ['my-work.read']),
            ('Project Manager', 'Operational', 48, '9/18 Modules', ['projects.manage']),
            ('Team Lead', 'Operational', 35, '6/18 Modules', ['tasks.write']),
            ('Recruiter', 'Operational', 30, '5/18 Modules', ['employees.create']),
            ('Auditor', 'Core Role', 20, '4/18 Modules', ['audit.read']),
            ('Support Agent', 'Standard', 18, '3/18 Modules', ['tickets.manage']),
            ('Executive', 'Core Role', 90, '16/18 Modules', ['reports.read']),
        ], start=1)
    ]
    first = ['Sarah','Marcus','Elena','David','Priya','James','Aisha','Chen','Omar','Nina']
    last = ['Chen','Rodriguez','Wilson','Sharma','Patel','Kim','Nguyen','Singh','Garcia','Brown']
    depts = ['Engineering','People','Finance','Sales','Delivery','Marketing','Operations','Support','Product','Legal','IT','Research']
    departments = [{'id': i+1, 'name': d, 'code': d[:3].upper(), 'status': 'ACTIVE'} for i,d in enumerate(depts)]
    admin_users, login_users, persons, employments, assignments, employee_roles = [], [], [], [], [], []
    for i in range(1, 85):
        fn, ln = first[(i-1)%len(first)], last[(i*3)%len(last)]
        persons.append({'id': i, 'first_name': fn, 'last_name': ln, 'email': f'{fn.lower()}.{ln.lower()}{i}@bytevon.com'})
        employments.append({'id': i, 'person_id': i, 'employee_code': f'EMP-{1000+i}', 'joining_date': '2024-01-01', 'status': 'ACTIVE'})
        assignments.append({'id': i, 'employment_id': i, 'department_id': departments[(i-1)%12]['id'], 'position_id': 1, 'effective_from': '2024-01-01', 'effective_to': None})
        if i % 9 != 0:
            st = 'LOCKED' if i % 23 == 0 else 'ACTIVE'
            login_users.append({'id': len(login_users)+1, 'employment_id': i, 'email': f'{fn.lower()}.{ln.lower()}{i}@bytevon.com', 'temporary_password': 'Pass@123', 'status': st, 'failed_attempt_count': 0, 'locked_until': None, 'last_login_at': iso(now) if st=='ACTIVE' else None, 'created_at': iso(now), 'updated_at': iso(now)})
            rid = roles[(i % len(roles))]['id']
            if i == 1: rid = 'R-01'
            employee_roles.append({'employment_id': i, 'role_id': rid, 'assigned_at': iso(now), 'changed_by': 1})
            name = f'{fn} {ln}'
            admin_users.append({'id': login_users[-1]['id'], 'employmentId': i, 'name': name, 'email': login_users[-1]['email'], 'role': next(r['name'] for r in roles if r['id']==rid), 'department': departments[(i-1)%12]['name'], 'status': 'Locked' if st=='LOCKED' else 'Active', 'lastLogin': 'Aug 24, 2026 10:00' if st=='ACTIVE' else 'Never', 'lastLoginAt': login_users[-1]['last_login_at'], 'initials': (fn[0]+ln[0]).upper(), 'employeeCode': f'EMP-{1000+i}'})
    for r in roles:
        r['usersCount'] = sum(1 for e in employee_roles if e['role_id']==r['id'])
    actions = ['Role updated','User locked','Settings saved','Permission granted','User created','Login success']
    modules = ['Roles','Auth','Settings','Users','Audit']
    audit_logs = [{'id': f'AUD-{9000-i}', 'action': actions[i%len(actions)], 'actor': admin_users[i%20]['name'], 'actorInitials': admin_users[i%20]['initials'], 'target': admin_users[(i+3)%len(admin_users)]['name'], 'module': modules[i%len(modules)], 'timestamp': 'Aug 24, 2026 10:00', 'timestamp_iso': iso(now - timedelta(hours=i)), 'ip': f'10.0.0.{i%50}'} for i in range(120)]
    resources = [{'id': i+1, 'name': n, 'description': n} for i,n in enumerate(['users','roles','settings','audit','employees','leave','attendance','projects','tasks','leads','clients','payroll','reports','notifications','approvals','organization','security','departments'])]
    permissions = []
    pid = 1
    for r in resources:
        for a in ['VIEW','CREATE','UPDATE','DELETE','APPROVE','EXPORT','UNLOCK']:
            permissions.append({'id': pid, 'resource_id': r['id'], 'resource_name': r['name'], 'action': a}); pid += 1
    data = {
        'meta': {'generated_at': iso(now), 'note': 'TEMPORARY demo store'},
        'auth_users': [
            {'email': 'admin@bytevon.local', 'password': 'ChangeMeAdmin!123', 'login_id': 1, 'name': admin_users[0]['name'], 'employment_id': 1, 'roles': ['Senior Administrator']},
            {'email': 'hr@bytevon.local', 'password': 'HrDemo!123', 'login_id': 2, 'name': admin_users[1]['name'] if len(admin_users)>1 else 'HR', 'employment_id': 2, 'roles': ['HR Manager']},
        ],
        'roles': roles, 'admin_users': admin_users, 'login_users': login_users, 'persons': persons,
        'employments': employments, 'employment_assignments': assignments, 'employee_roles': employee_roles,
        'departments': departments, 'positions': [{'id': i, 'name': n, 'status': 'ACTIVE'} for i,n in enumerate(['Software Engineer','HR Specialist','Accountant','Sales Executive','Project Manager','Team Lead','Director','Intern'],1)],
        'audit_logs': audit_logs, 'security_events': [], 'resources': resources, 'permissions': permissions,
        'organization_profile': {'name': 'Bytevon Global Holdings', 'legal': 'Bytevon Global Holdings Inc.', 'email': 'admin@bytevon.com', 'phone': '+1 (555) 012-3456', 'website': 'https://bytevon.com', 'tax': 'TX-9928341', 'reg': 'BRN-001293', 'description': 'Enterprise workforce platform.'},
        'attendance_settings': {'shiftStart': '09:00', 'shiftEnd': '18:00', 'graceMinutes': 15, 'earlyOutMinutes': 30, 'otMinMinutes': 60, 'allowRemoteCheckIn': True},
        'leave_accrual_policy': {'maxCarryOverDays': 10, 'minimumNoticeDays': 7},
        'offices': [{'id': 'ny', 'name': 'New York HQ', 'country': 'United States', 'city': 'New York', 'timezone': 'UTC-05:00', 'currency': 'USD', 'fiscal': 'Jan - Dec', 'address': '123 Enterprise Way', 'postal': '10001'}, {'id': 'blr', 'name': 'Bangalore Hub', 'country': 'India', 'city': 'Bengaluru', 'timezone': 'UTC+05:30', 'currency': 'INR', 'fiscal': 'Apr - Mar', 'address': 'Manyata Tech Park', 'postal': '560045'}],
        'sessions': [{'id': 1, 'login_id': 1, 'device_name': 'MacBook Pro · Chrome', 'device_type': 'DESKTOP', 'ip_address': '203.0.113.10', 'status': 'ACTIVE', 'last_used_at': iso(now), 'current': True, 'refresh_token': 'mock-refresh-token-1'}],
        'metrics': {'users': len(admin_users), 'roles': len(roles), 'activeSessions': 86, 'auditEventsToday': 142, 'configHealth': 'Good', 'securityScore': 94, 'mfaAdoption': 88, 'openAlerts': 0, 'offices': 2, 'departments': 12, 'employees': 84},
        'counters': {'next_role': 13, 'next_audit': 8880, 'next_login': len(login_users)+1},
    }
    save(data)
    print(f'Seed written to {STORE_PATH} users={len(admin_users)} roles={len(roles)} audit={len(audit_logs)}')

if __name__ == '__main__':
    main()
