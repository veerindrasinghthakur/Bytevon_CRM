import { useState } from 'react'
import { useNavigate, useParams } from '@tanstack/react-router'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { employees } from '../data/mock'
import { cn } from '@/shared/lib/cn'

function Icon({ name, className }: { name: string; className?: string }) {
  return <span className={cn('material-symbols-outlined', className)} aria-hidden>{name}</span>
}

export function EmployeeDetailPage() {
  const { employeeId } = useParams({ strict: false }) as { employeeId: string }
  const navigate = useNavigate()
  const emp = employees.find((e) => e.id === employeeId) ?? employees[3]
  const [tab, setTab] = useState<'overview' | 'payroll' | 'documents'>('overview')

  return (
    <div className="space-y-6">
      <PageHeader
        title={emp.name}
        description={`${emp.title} · ${emp.department}`}
        showBack
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="primary" leftIcon={<Icon name="edit" className="text-lg" />}>Edit Employee</Button>
            <Button variant="outline" leftIcon={<Icon name="print" className="text-lg" />}>Print</Button>
            <Button variant="outline" leftIcon={<Icon name="download" className="text-lg" />}>Download Profile</Button>
            <Button variant="outline" className="!text-error !border-error" leftIcon={<Icon name="person_off" className="text-lg" />}>Deactivate</Button>
          </div>
        }
      />

      <div className="flex items-center gap-2">
        <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-bold rounded-full border border-green-200">
          {emp.status.toUpperCase()}
        </span>
        <span className="text-label-sm text-on-surface-variant">Emp ID: {emp.employeeCode}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-6 text-center shadow-sm">
            <div className="w-28 h-28 mx-auto rounded-full bg-secondary/10 text-secondary flex items-center justify-center text-3xl font-bold mb-3">
              {emp.avatarInitials ?? emp.name.split(' ').map((p) => p[0]).join('').slice(0, 2)}
            </div>
            <h2 className="text-title-lg font-semibold">{emp.name}</h2>
            <p className="text-label-sm text-on-surface-variant uppercase tracking-wider mb-4">{emp.employeeCode}</p>
            <div className="text-left space-y-3 border-t border-outline-variant pt-4">
              <div className="flex gap-3">
                <Icon name="mail" className="text-secondary" />
                <div>
                  <p className="text-label-sm text-on-surface-variant">Email</p>
                  <p className="text-body-sm">{emp.email}</p>
                </div>
              </div>
              {emp.phone && (
                <div className="flex gap-3">
                  <Icon name="call" className="text-secondary" />
                  <div>
                    <p className="text-label-sm text-on-surface-variant">Phone</p>
                    <p className="text-body-sm">{emp.phone}</p>
                  </div>
                </div>
              )}
              {emp.location && (
                <div className="flex gap-3">
                  <Icon name="location_on" className="text-secondary" />
                  <div>
                    <p className="text-label-sm text-on-surface-variant">Location</p>
                    <p className="text-body-sm">{emp.location}</p>
                  </div>
                </div>
              )}
            </div>
            <div className="mt-4 p-3 bg-surface-container-low rounded-lg text-left">
              <p className="text-label-sm text-on-surface-variant">Department</p>
              <p className="font-semibold">{emp.department}</p>
              {emp.managerName && (
                <>
                  <p className="text-label-sm text-on-surface-variant mt-2">Reporting Manager</p>
                  <p className="font-medium text-sm">{emp.managerName}</p>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-9">
          <div className="bg-surface-container-lowest rounded-t-xl border border-outline-variant flex overflow-x-auto">
            {([
              ['overview', 'Overview'],
              ['payroll', 'Payroll & Assets'],
              ['documents', 'Documents & Timeline'],
            ] as const).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={cn(
                  'px-6 py-4 text-label-md whitespace-nowrap border-b-2 transition-colors',
                  tab === id ? 'border-secondary text-secondary font-semibold' : 'border-transparent text-on-surface-variant'
                )}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="bg-surface-container-lowest border border-t-0 border-outline-variant rounded-b-xl p-6 space-y-6 shadow-sm">
            {tab === 'overview' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 border border-outline-variant rounded-lg">
                    <p className="text-label-sm text-on-surface-variant mb-1">Joining Date</p>
                    <p className="text-title-lg font-semibold">{emp.joiningDate}</p>
                  </div>
                  <div className="p-4 border border-outline-variant rounded-lg">
                    <p className="text-label-sm text-on-surface-variant mb-1">Probation Status</p>
                    <p className="text-title-lg font-semibold text-secondary flex items-center gap-1">Completed <Icon name="check_circle" className="text-xl" /></p>
                  </div>
                  <div className="p-4 border border-outline-variant rounded-lg">
                    <p className="text-label-sm text-on-surface-variant mb-1">Contract Type</p>
                    <p className="text-title-lg font-semibold">{emp.employmentType}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-label-md text-on-surface-variant uppercase tracking-wider mb-3">Attendance Summary</h4>
                    <div className="grid grid-cols-3 gap-2">
                      {[ ['21', 'Present'], ['0', 'Absent'], ['2', 'Late'] ].map(([v, l]) => (
                        <div key={l} className="bg-surface-container-low p-4 rounded-lg text-center">
                          <p className="text-2xl font-bold text-secondary">{v}</p>
                          <p className="text-[10px] font-semibold text-on-surface-variant uppercase">{l}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-3">
                      <h4 className="text-label-md text-on-surface-variant uppercase tracking-wider">Leave Balance</h4>
                      <Button size="sm" variant="primary" onClick={() => navigate({ to: '/my-work/leave/apply' })}>Apply Leave</Button>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-xs mb-1"><span>Annual Leave</span><span>12 / 18 days</span></div>
                        <div className="w-full h-2 bg-surface-variant rounded-full overflow-hidden"><div className="bg-secondary h-full" style={{ width: '66%' }} /></div>
                      </div>
                      <div>
                        <div className="flex justify-between text-xs mb-1"><span>Sick Leave</span><span>8 / 10 days</span></div>
                        <div className="w-full h-2 bg-surface-variant rounded-full overflow-hidden"><div className="bg-secondary h-full" style={{ width: '80%' }} /></div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
            {tab === 'payroll' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-primary-container text-white p-6 rounded-xl">
                  <p className="text-sm text-white/70 uppercase mb-1">Net Monthly Salary</p>
                  <p className="text-4xl font-bold mb-4">$12,450.00</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><p className="text-white/50 text-xs">Base Pay</p><p className="font-semibold">$9,500</p></div>
                    <div><p className="text-white/50 text-xs">Allowances</p><p className="font-semibold">$3,100</p></div>
                  </div>
                </div>
                <div className="border border-outline-variant rounded-xl p-4">
                  <h4 className="text-label-md text-on-surface-variant mb-3">Assigned Assets</h4>
                  <ul className="space-y-2 text-body-sm">
                    <li className="flex items-center gap-2"><Icon name="laptop_mac" className="text-secondary" /> MacBook Pro 16&quot;</li>
                    <li className="flex items-center gap-2"><Icon name="smartphone" className="text-secondary" /> iPhone 15 Pro Max</li>
                    <li className="flex items-center gap-2"><Icon name="badge" className="text-secondary" /> Access Card — HQ</li>
                  </ul>
                </div>
              </div>
            )}
            {tab === 'documents' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-label-md text-on-surface-variant uppercase tracking-wider mb-3">Document Repository</h4>
                  <div className="space-y-2">
                    {['Employment_Contract_Final.pdf', 'AWS_Solutions_Architect_Cert.pdf', 'Passport_Scan_Copy.pdf'].map((f) => (
                      <div key={f} className="flex items-center justify-between p-3 border border-outline-variant rounded-lg">
                        <div className="flex items-center gap-2">
                          <Icon name="description" className="text-secondary" />
                          <span className="text-body-sm font-medium">{f}</span>
                        </div>
                        <Icon name="download" className="text-on-surface-variant" />
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-label-md text-on-surface-variant uppercase tracking-wider mb-3">Activity Timeline</h4>
                  <div className="space-y-4 border-l-2 border-outline-variant pl-4 ml-2">
                    <div>
                      <p className="text-xs font-bold text-secondary">Today</p>
                      <p className="text-body-sm font-medium">Successful login from San Francisco Office</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-on-surface-variant">June 15, 2024</p>
                      <p className="text-body-sm font-medium">Promoted to Senior Solutions Architect</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
