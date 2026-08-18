import { useState } from 'react'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { SessionStatus, DeviceType } from '@/shared/schema'
import { cn } from '@/shared/lib/cn'

type Session = {
  id: number
  device_name: string
  device_type: string
  ip_address: string
  status: string
  last_used_at: string
  current?: boolean
}

const INITIAL: Session[] = [
  {
    id: 1,
    device_name: 'MacBook Pro · Chrome',
    device_type: DeviceType.DESKTOP,
    ip_address: '203.0.113.10',
    status: SessionStatus.ACTIVE,
    last_used_at: '2026-08-18 14:22',
    current: true,
  },
  {
    id: 2,
    device_name: 'iPhone 15 · Safari',
    device_type: DeviceType.MOBILE,
    ip_address: '198.51.100.22',
    status: SessionStatus.ACTIVE,
    last_used_at: '2026-08-17 09:10',
  },
  {
    id: 3,
    device_name: 'Office PC · Edge',
    device_type: DeviceType.DESKTOP,
    ip_address: '203.0.113.88',
    status: SessionStatus.REVOKED,
    last_used_at: '2026-08-10 18:00',
  },
]

export function ActiveSessionsPage() {
  const [sessions, setSessions] = useState(INITIAL)

  const revoke = (id: number) => {
    setSessions((list) =>
      list.map((s) => (s.id === id ? { ...s, status: SessionStatus.REVOKED } : s)),
    )
  }

  const revokeAll = () => {
    setSessions((list) =>
      list.map((s) => (s.current ? s : { ...s, status: SessionStatus.REVOKED })),
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Active sessions"
        description="Manage signed-in devices. Revoking ends refresh tokens for that session."
        actions={
          <Button variant="outline" onClick={revokeAll}>
            Revoke all others
          </Button>
        }
      />
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-surface-container-low border-b border-outline-variant">
              {['Device', 'IP', 'Last used', 'Status', ''].map((h) => (
                <th key={h} className="px-5 py-3 text-label-sm uppercase text-on-surface-variant">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sessions.map((s) => (
              <tr key={s.id} className="border-b border-outline-variant last:border-0 bv-row-hover">
                <td className="px-5 py-3">
                  <p className="font-medium">{s.device_name}</p>
                  <p className="text-label-sm text-on-surface-variant">{s.device_type}</p>
                </td>
                <td className="px-5 py-3 text-body-sm font-mono">{s.ip_address}</td>
                <td className="px-5 py-3 text-body-sm">{s.last_used_at}</td>
                <td className="px-5 py-3">
                  <span
                    className={cn(
                      'px-2.5 py-0.5 rounded-full text-[10px] font-bold',
                      s.status === SessionStatus.ACTIVE
                        ? 'bg-secondary/15 text-secondary'
                        : 'bg-surface-container text-on-surface-variant',
                    )}
                  >
                    {s.status}
                    {s.current ? ' · THIS DEVICE' : ''}
                  </span>
                </td>
                <td className="px-5 py-3 text-right">
                  {s.status === SessionStatus.ACTIVE && !s.current && (
                    <button
                      type="button"
                      className="text-sm font-medium text-error hover:underline cursor-pointer"
                      onClick={() => revoke(s.id)}
                    >
                      Revoke
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
