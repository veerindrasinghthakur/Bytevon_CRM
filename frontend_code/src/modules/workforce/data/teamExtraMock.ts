/**
 * @deprecated Team detail / members / projects pages now load via
 * `useTeamDetail` → projects `getTeam` / `getTeamMembers` / `getTeamProjects`.
 * Kept only for any remaining ad-hoc UI demos; do not wire new screens here.
 */
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
    {
      id: 'm1',
      name: 'David Chen',
      title: 'Senior Backend Engineer',
      role: 'Lead',
      email: 'd.chen@bytevon.io',
      status: 'Active',
      joined: '2021-03-12',
    },
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
  t1: [],
}

export const assignableProjects = [
  { id: 'ap1', name: 'Customer Portal Redesign', client: 'Acme Retail', status: 'Planning' },
  { id: 'ap2', name: 'Mobile SDK v3', client: 'Internal', status: 'Active' },
]

export function membersFor(teamId: string) {
  return teamMembersByTeam[teamId] ?? teamMembersByTeam.t1 ?? []
}

export function projectsFor(teamId: string) {
  return teamProjectsByTeam[teamId] ?? teamProjectsByTeam.t1 ?? []
}
