export type DocumentItem = {
  id: number
  name: string
  mime_type: string
  size_label: string
  uploaded_by: string
  uploaded_at: string
  reference_type: 'PROJECT' | 'EMPLOYMENT' | 'LEAD' | 'CLIENT'
  reference_id: number
}

export const documentsList: DocumentItem[] = [
  {
    id: 1,
    name: 'SOW_Project_Alpha.pdf',
    mime_type: 'application/pdf',
    size_label: '1.2 MB',
    uploaded_by: 'Marcus Sterling',
    uploaded_at: '2026-07-02',
    reference_type: 'PROJECT',
    reference_id: 1042,
  },
  {
    id: 2,
    name: 'Architecture_Diagram_v3.png',
    mime_type: 'image/png',
    size_label: '840 KB',
    uploaded_by: 'Sarah Jenkins',
    uploaded_at: '2026-07-18',
    reference_type: 'PROJECT',
    reference_id: 1042,
  },
  {
    id: 3,
    name: 'Employee_Handbook_2026.pdf',
    mime_type: 'application/pdf',
    size_label: '3.4 MB',
    uploaded_by: 'HR Ops',
    uploaded_at: '2026-01-05',
    reference_type: 'EMPLOYMENT',
    reference_id: 0,
  },
  {
    id: 4,
    name: 'NDA_Template.docx',
    mime_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    size_label: '210 KB',
    uploaded_by: 'Legal',
    uploaded_at: '2026-03-14',
    reference_type: 'CLIENT',
    reference_id: 12,
  },
]
