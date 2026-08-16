import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Button } from '@/shared/components/ui/Button'

interface SalaryRow {
  id: string
  name: string
  type: 'EARNING' | 'DEDUCTION'
  amount: number
}

const initialRows: SalaryRow[] = [
  { id: '1', name: 'Basic', type: 'EARNING', amount: 30000 },
  { id: '2', name: 'HRA', type: 'EARNING', amount: 15000 },
  { id: '3', name: 'PF', type: 'DEDUCTION', amount: 3600 },
]

export function ReviseSalaryPage() {
  const navigate = useNavigate()
  const [rows, setRows] = useState(initialRows)

  const totalEarnings = rows.filter((r) => r.type === 'EARNING').reduce((s, r) => s + r.amount, 0)
  const totalDeductions = rows.filter((r) => r.type === 'DEDUCTION').reduce((s, r) => s + r.amount, 0)
  const net = totalEarnings - totalDeductions

  const addRow = () => setRows((prev) => [...prev, { id: String(Date.now()), name: '', type: 'EARNING', amount: 0 }])
  const removeRow = (id: string) => setRows((prev) => prev.filter((r) => r.id !== id))
  const updateRow = (id: string, patch: Partial<SalaryRow>) =>
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)))

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-headline-lg font-semibold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-electric-blue">payments</span> Revise Salary
          </h1>
          <p className="text-body-md text-on-surface-variant mt-1">Create a new salary version for the employee.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => navigate({ to: '/payroll/salary' })}>Cancel</Button>
          <Button variant="primary" size="sm" onClick={() => navigate({ to: '/payroll/salary' })}>Save Salary</Button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-8">
          <section className="bg-surface-container-lowest rounded-xl p-6 border border-outline-variant shadow-sm flex items-start gap-6">
            <div className="w-20 h-20 rounded-full bg-secondary-container flex items-center justify-center text-primary font-bold text-xl border border-outline-variant">RC</div>
            <div className="flex-1">
              <h2 className="text-title-lg font-semibold text-on-surface">Robert Chen</h2>
              <p className="text-body-sm text-on-surface-variant mt-1">
                <span className="text-label-md text-electric-blue bg-primary-fixed px-2 py-0.5 rounded">EMP-1042</span>
              </p>
              <div className="grid grid-cols-2 gap-4 mt-4 pt-2 border-t border-outline-variant">
                <div>
                  <p className="text-label-sm text-on-surface-variant uppercase">Department</p>
                  <p className="text-body-md text-on-surface font-medium mt-1">Engineering</p>
                </div>
                <div>
                  <p className="text-label-sm text-on-surface-variant uppercase">Position</p>
                  <p className="text-body-md text-on-surface font-medium mt-1">Senior Engineer</p>
                </div>
              </div>
            </div>
          </section>

          <section className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden">
            <div className="p-6 border-b border-outline-variant bg-surface-bright">
              <h3 className="text-title-lg font-semibold text-on-surface">Salary Items Configuration</h3>
            </div>
            <div className="p-6 space-y-3">
              {rows.map((row) => (
                <div key={row.id} className="grid grid-cols-12 gap-4 items-center bg-surface-container p-2 rounded-lg border border-outline-variant">
                  <div className="col-span-5">
                    <input className="w-full bg-surface-container-lowest border border-outline-variant rounded-md px-3 py-2 text-body-sm outline-none" value={row.name} onChange={(e) => updateRow(row.id, { name: e.target.value })} />
                  </div>
                  <div className="col-span-3">
                    <select className="w-full bg-surface-container-lowest border border-outline-variant rounded-md px-3 py-2 text-body-sm outline-none" value={row.type} onChange={(e) => updateRow(row.id, { type: e.target.value as 'EARNING' | 'DEDUCTION' })}>
                      <option value="EARNING">EARNING</option>
                      <option value="DEDUCTION">DEDUCTION</option>
                    </select>
                  </div>
                  <div className="col-span-3">
                    <input type="number" className="w-full bg-surface-container-lowest border border-outline-variant rounded-md px-3 py-2 text-body-sm outline-none text-right" value={row.amount} onChange={(e) => updateRow(row.id, { amount: Number(e.target.value) || 0 })} />
                  </div>
                  <div className="col-span-1 flex justify-center">
                    <button type="button" className="p-1.5 text-outline hover:text-error" onClick={() => removeRow(row.id)}>
                      <span className="material-symbols-outlined text-[20px]">delete</span>
                    </button>
                  </div>
                </div>
              ))}
              <button type="button" onClick={addRow} className="mt-2 flex items-center gap-2 text-label-md text-electric-blue px-3 py-2 rounded-lg border border-dashed border-electric-blue w-full justify-center">
                <span className="material-symbols-outlined text-[20px]">add</span> Add Salary Item
              </button>
            </div>
          </section>
        </div>

        <div className="lg:col-span-4">
          <section className="bg-deep-navy text-on-primary rounded-xl p-6 shadow-sm">
            <h3 className="text-title-lg font-semibold text-surface-bright mb-4">Calculation Summary</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-on-secondary-fixed">
                <span className="text-body-md text-primary-fixed-dim">Total Earnings</span>
                <span className="text-label-md text-surface-bright">₹{totalEarnings.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-on-secondary-fixed">
                <span className="text-body-md text-primary-fixed-dim">Total Deductions</span>
                <span className="text-label-md text-error-container">-₹{totalDeductions.toLocaleString()}</span>
              </div>
              <div className="pt-2">
                <span className="text-label-sm text-primary-fixed-dim uppercase tracking-widest block mb-1">Net Gross Salary</span>
                <div className="text-display-lg font-bold text-electric-blue tracking-tight">₹{net.toLocaleString()}</div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
