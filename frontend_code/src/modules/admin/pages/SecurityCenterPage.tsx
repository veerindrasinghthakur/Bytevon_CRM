import { useEffect, useState } from 'react'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { adminKpis, securityEvents } from '../data/mock'
import { cn } from '@/shared/lib/cn'

export function SecurityCenterPage() {
  const [score, setScore] = useState(1)
  const [mfa, setMfa] = useState(true)
  const [adaptive, setAdaptive] = useState(true)
  const [sessionTimeout, setSessionTimeout] = useState(false)

  useEffect(() => {
    let frame = 0
    const target = adminKpis.securityScore
    const id = window.setInterval(() => {
      frame += 1
      const next = Math.min(target, Math.round((frame / 30) * target))
      setScore(next)
      if (next >= target) window.clearInterval(id)
    }, 20)
    return () => window.clearInterval(id)
  }, [])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Security Center"
        description="Sessions, lockouts, authentication policy, and infrastructure posture."
        actions={
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1 bg-surface-container-low rounded-full border border-outline-variant/30">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-label-md text-on-surface">System Live</span>
            </div>
            <Button variant="outline" size="sm">
              Refresh
            </Button>
          </div>
        }
      />

      {/* Health Score */}
      <section className="flex flex-col md:flex-row items-center justify-between bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-sm">
        <div className="flex items-center gap-6">
          <div
            className="relative w-24 h-24 flex items-center justify-center rounded-full p-1"
            style={{
              background: `conic-gradient(rgb(0, 112, 234) ${score}%, rgb(226, 232, 240) 0)`,
            }}
          >
            <div className="w-full h-full bg-white rounded-full flex flex-col items-center justify-center">
              <span className="text-3xl font-black text-primary leading-none">{score}</span>
              <span className="text-[10px] uppercase font-bold text-on-surface-variant">/ 100</span>
            </div>
          </div>
          <div>
            <h2 className="text-title-lg font-semibold text-primary">Security Health Score</h2>
            <p className="text-body-md text-on-surface-variant max-w-md">
              Your security posture is strong. 2 minor optimizations available in Infrastructure
              Security settings.
            </p>
          </div>
        </div>
        <Button
          variant="primary"
          className="mt-4 md:mt-0 shadow-lg shadow-secondary/20 active:scale-95 transition-transform"
        >
          Run Vulnerability Scan
        </Button>
      </section>

      {/* KPI cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant shadow-sm hover:shadow-md transition-all group">
          <div className="flex justify-between items-start mb-3">
            <span className="material-symbols-outlined p-2 bg-secondary/10 text-secondary rounded-lg">
              fingerprint
            </span>
            <span className="text-green-600 font-bold text-label-sm">+2% vs LW</span>
          </div>
          <p className="text-on-surface-variant text-label-md">MFA Adoption</p>
          <h3 className="text-3xl font-black text-primary">{adminKpis.mfaAdoption}%</h3>
          <div className="mt-3 w-full bg-surface-container rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-secondary h-full rounded-full group-hover:scale-x-105 transition-transform origin-left"
              style={{ width: `${adminKpis.mfaAdoption}%` }}
            />
          </div>
        </div>

        <div className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant shadow-sm hover:shadow-md transition-all group">
          <div className="flex justify-between items-start mb-3">
            <span className="material-symbols-outlined p-2 bg-blue-100 text-blue-600 rounded-lg">hub</span>
          </div>
          <p className="text-on-surface-variant text-label-md">Active SSO Sessions</p>
          <h3 className="text-3xl font-black text-primary">1,240</h3>
          <p className="text-label-sm text-on-surface-variant/60 mt-1">Global coverage active</p>
        </div>

        <div className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant shadow-sm hover:shadow-md transition-all group">
          <div className="flex justify-between items-start mb-3">
            <span className="material-symbols-outlined p-2 bg-green-100 text-green-600 rounded-lg">
              check_circle
            </span>
          </div>
          <p className="text-on-surface-variant text-label-md">Open Security Alerts</p>
          <h3 className="text-3xl font-black text-green-600">{adminKpis.openAlerts}</h3>
          <p className="text-label-sm text-green-600/80 mt-1">All threats mitigated</p>
        </div>

        <div className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant shadow-sm hover:shadow-md transition-all group">
          <div className="flex justify-between items-start mb-3">
            <span className="material-symbols-outlined p-2 bg-amber-100 text-amber-600 rounded-lg">
              history
            </span>
          </div>
          <p className="text-on-surface-variant text-label-md">Last System Audit</p>
          <h3 className="text-3xl font-black text-primary">2h ago</h3>
          <p className="text-label-sm text-amber-600 mt-1">Full integrity report ready</p>
        </div>
      </section>

      {/* Auth + Infrastructure bento */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-7 bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-title-lg font-semibold text-primary">Authentication Protocols</h3>
            <button type="button" className="text-secondary text-label-md font-bold hover:underline">
              Advanced Rules
            </button>
          </div>
          <div className="space-y-3">
            <ProtocolRow
              icon="security"
              iconClass="bg-primary text-white"
              title="Global MFA Enforcement"
              description="Require multi-factor for all user levels."
              checked={mfa}
              onChange={setMfa}
            />
            <ProtocolRow
              icon="psychology"
              iconClass="bg-surface-container text-primary"
              title="Adaptive Authentication"
              description="Step-up auth based on risk signals."
              checked={adaptive}
              onChange={setAdaptive}
            />
            <ProtocolRow
              icon="timer"
              iconClass="bg-surface-container text-primary"
              title="Session Timeout Rules"
              description="Force re-auth after 30 mins of inactivity."
              checked={sessionTimeout}
              onChange={setSessionTimeout}
            />
          </div>
        </div>

        <div className="lg:col-span-5 bg-primary text-white rounded-xl shadow-sm p-6 flex flex-col">
          <h3 className="text-title-lg font-semibold text-white mb-6">Infrastructure Security</h3>
          <div className="space-y-4 flex-1">
            <div className="p-4 bg-white/5 rounded-lg border border-white/10">
              <div className="flex justify-between items-center mb-3">
                <p className="font-bold text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">dns</span>
                  IP Whitelisting
                </p>
                <span className="text-label-sm bg-secondary px-2 py-0.5 rounded text-white">Active</span>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-body-sm opacity-80">
                  <span>Primary HQ</span>
                  <code>192.168.1.0/24</code>
                </div>
                <div className="flex justify-between text-body-sm opacity-80">
                  <span>Cloud Relay</span>
                  <code>10.0.4.15/32</code>
                </div>
              </div>
              <button
                type="button"
                className="w-full mt-4 py-2 border border-white/20 rounded hover:bg-white/10 transition-all text-label-md"
              >
                Manage Ranges
              </button>
            </div>
            <div className="p-4 bg-white/5 rounded-lg border border-white/10">
              <div className="flex justify-between items-center mb-3">
                <p className="font-bold text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">public</span>
                  Login Geo-fencing
                </p>
                <span className="text-label-sm bg-white/20 px-2 py-0.5 rounded text-white">Restricted</span>
              </div>
              <p className="text-body-sm opacity-70">
                Blocking 14 unauthorized regions. Active policy:{' '}
                <strong>Strict-North-America</strong>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Recent security events */}
      <section className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-outline-variant">
          <h3 className="text-title-lg font-semibold text-primary">Recent Security Events</h3>
          <div className="flex gap-2">
            <span className="px-3 py-1 bg-surface-container rounded text-label-md cursor-pointer hover:bg-surface-variant transition-colors">
              All Logs
            </span>
            <span className="px-3 py-1 bg-surface-container rounded text-label-md cursor-pointer hover:bg-surface-variant transition-colors">
              Errors Only
            </span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-surface-container-low border-b border-outline-variant text-on-surface-variant text-label-sm uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3 font-bold">Event Type</th>
                <th className="px-6 py-3 font-bold">Identity</th>
                <th className="px-6 py-3 font-bold">Source</th>
                <th className="px-6 py-3 font-bold">Timestamp</th>
                <th className="px-6 py-3 font-bold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {securityEvents.map((ev) => (
                <tr key={ev.id} className="hover:bg-surface-container-low/40 transition-colors">
                  <td className="px-6 py-4 text-body-sm font-medium text-on-surface">{ev.eventType}</td>
                  <td className="px-6 py-4 text-body-sm text-on-surface-variant">{ev.identity}</td>
                  <td className="px-6 py-4 text-body-sm text-on-surface-variant">{ev.source}</td>
                  <td className="px-6 py-4 text-body-sm text-on-surface-variant">{ev.timestamp}</td>
                  <td className="px-6 py-4">
                    <span
                      className={cn(
                        'inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-bold',
                        ev.status === 'Success' && 'bg-green-100 text-green-700',
                        ev.status === 'Blocked' && 'bg-red-100 text-red-700',
                        ev.status === 'Warning' && 'bg-amber-100 text-amber-800'
                      )}
                    >
                      {ev.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* V1 policy notes */}
      <section className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm p-6 space-y-3">
        <h3 className="text-title-lg font-semibold text-on-background">Password &amp; Session Policy (V1)</h3>
        <ul className="space-y-2 text-body-md text-on-surface-variant">
          <li className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-[18px]">check</span>
            Access JWT lifetime: 5–10 minutes (not stored)
          </li>
          <li className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-[18px]">check</span>
            Refresh tokens hashed on sessions; revoke-all supported
          </li>
          <li className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-[18px]">check</span>
            Account lockout via failed_attempt_count + locked_until
          </li>
          <li className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-[18px]">check</span>
            Always ≥1 super-admin; last super-admin cannot be removed
          </li>
          <li className="flex items-center gap-2">
            <span className="material-symbols-outlined text-on-surface-variant text-[18px]">remove</span>
            Password history and MFA not enforced in product V1 (UI preview only)
          </li>
        </ul>
      </section>
    </div>
  )
}

function ProtocolRow({
  icon,
  iconClass,
  title,
  description,
  checked,
  onChange,
}: {
  icon: string
  iconClass: string
  title: string
  description: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between p-4 bg-surface-container-low border border-outline-variant rounded-lg">
      <div className="flex gap-4 items-center">
        <div className={cn('p-3 rounded-lg', iconClass)}>
          <span className="material-symbols-outlined">{icon}</span>
        </div>
        <div>
          <p className="font-bold text-primary">{title}</p>
          <p className="text-body-sm text-on-surface-variant">{description}</p>
        </div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative w-11 h-6 rounded-full transition-colors',
          checked ? 'bg-secondary' : 'bg-outline-variant'
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all',
            checked ? 'left-[22px]' : 'left-0.5'
          )}
        />
      </button>
    </div>
  )
}
