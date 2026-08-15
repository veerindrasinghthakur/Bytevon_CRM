export const teamMembersByTeam: Record<
  string,
  Array<{
    id: string
    name: string
    title: string
    role: string
    email: string
    status: 'Active' | 'On Leave'
    joined: string
  }>
> = {
  t1: [
    { id: 'm1', name: 'David Chen', title: 'Senior Backend Engineer', role: 'Lead', email: 'd.chen@bytevon.io', status: 'Active', joined: '2021-03-12' },
    { id: 'm2', name: 'Maria Rodriguez', title: 'Database Architect', role: 'Senior', email: 'm.rod@bytevon.io', status: 'Active', joined: '2020-11-01' },
    { id: 'm3', name: 'James Wilson', title: 'DevOps Lead', role: 'Lead', email: 'j.wilson@bytevon.io', status: 'Active', joined: '2019-08-20' },
    { id: 'm4', name: 'Alex Kim', title: 'QA Engineer', role: 'Junior', email: 'a.kim@bytevon.io', status: 'Active', joined: '2023-10-24' },
    { id: 'm5', name: 'Priya Sharma', title: 'Backend Engineer', role: 'Senior', email: 'p.sharma@bytevon.io', status: 'On Leave', joined: '2022-01-15' },
    { id: 'm6', name: 'Jordan Lee', title: 'API Engineer', role: 'Junior', email: 'j.lee@bytevon.io', status: 'Active', joined: '2023-05-01' },
  ],
}

export const teamProjectsByTeam: Record<
  string,
  Array<{
    id: string
    name: string
    client: string
    status: 'Active' | 'Completed' | 'On Hold'
    due: string
    pct: number
    role: string
  }>
> = {
  t1: [
    { id: 'p1', name: 'Nexus Data Migration', client: 'Nexus Corp', status: 'Active', due: 'Nov 15, 2024', pct: 75, role: 'Primary' },
    { id: 'p2', name: 'Project Horizon API', client: 'Internal Initiative', status: 'Active', due: 'Dec 01, 2024', pct: 40, role: 'Support' },
    { id: 'p3', name: 'Legacy Auth Decommission', client: 'Internal', status: 'Completed', due: 'Sep 30, 2024', pct: 100, role: 'Primary' },
    { id: 'p4', name: 'Realtime Analytics Pipeline', client: 'Orbit Labs', status: 'On Hold', due: 'Jan 20, 2025', pct: 15, role: 'Consulting' },
  ],
}

export const assignableProjects = [
  { id: 'ap1', name: 'Customer Portal Redesign', client: 'Acme Retail', status: 'Planning' },
  { id: 'ap2', name: 'Mobile SDK v3', client: 'Internal', status: 'Active' },
  { id: 'ap3', name: 'Compliance Audit Support', client: 'RegTech Co', status: 'Active' },
  { id: 'ap4', name: 'Data Lake Migration', client: 'Nexus Corp', status: 'Planning' },
]

export function membersFor(teamId: string) {
  return teamMembersByTeam[teamId] ?? teamMembersByTeam.t1
}

export function projectsFor(teamId: string) {
  return teamProjectsByTeam[teamId] ?? teamProjectsByTeam.t1
}
