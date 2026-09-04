export type TeamMemberMock = {
  id: string
  name: string
  role: string
  status: 'Active'
}

export const teamMembersMock: TeamMemberMock[] = [
  { id: '1', name: 'Sarah Chen', role: 'Tech Lead', status: 'Active' },
  { id: '2', name: 'Jordan Lee', role: 'Senior Engineer', status: 'Active' },
  { id: '3', name: 'Priya Sharma', role: 'Engineer', status: 'Active' },
  { id: '4', name: 'Marcus Thorne', role: 'QA', status: 'Active' },
]
