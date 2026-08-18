import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { PageLoadingSkeleton } from '@/shared/components/feedback/PageLoadingSkeleton'
import { EmptyState } from '@/shared/components/feedback/EmptyState'
import { ErrorState } from '@/shared/components/feedback/ErrorState'
import { getLocations } from '../api/organization'
import type { LocationRow } from '@/shared/schema'
import { cn } from '@/shared/lib/cn'

export function LocationsListPage() {
  const navigate = useNavigate()
  const [items, setItems] = useState<LocationRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [q, setQ] = useState('')

  const load = () => {
    setLoading(true)
    setError(null)
    getLocations({ includeArchived: true })
      .then((r) => setItems(r.items))
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return items
    return items.filter(
      (l) =>
        l.name.toLowerCase().includes(s) ||
        l.city.toLowerCase().includes(s) ||
        l.country.toLowerCase().includes(s),
    )
  }, [items, q])

  const active = items.filter((l) => !l.is_archived).length
  const archived = items.filter((l) => l.is_archived).length

  if (loading) return <PageLoadingSkeleton />
  if (error) return <ErrorState description={error} onRetry={load} />

  return (
    <div className="space-y-6">
      <PageHeader
        title="Locations"
        description="Manage office locations for the organization"
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
                search
              </span>
              <input
                className="w-[240px] pl-9 pr-4 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-lg text-body-sm focus:outline-none focus:border-secondary shadow-sm"
                placeholder="Filter by name or city..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
            <Button
              variant="primary"
              leftIcon={<span className="material-symbols-outlined text-lg">add</span>}
              onClick={() => navigate({ to: '/admin/settings/offices/new' })}
            >
              Add Location
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Active Offices', value: active },
          { label: 'Archived Offices', value: archived },
          { label: 'Timezones', value: new Set(items.map((l) => l.timezone)).size },
          { label: 'Currencies', value: new Set(items.map((l) => l.currency)).size },
        ].map((k) => (
          <div
            key={k.label}
            className="bg-surface-container-lowest rounded-xl p-5 border border-outline-variant shadow-sm card-hover"
          >
            <span className="text-label-sm text-on-surface-variant uppercase tracking-wider">{k.label}</span>
            <p className="text-display-lg font-bold text-on-background mt-1">{k.value}</p>
          </div>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No locations"
          description="Add an office location to configure attendance radius, timezone, and payroll region."
          action={
            <Button variant="primary" onClick={() => navigate({ to: '/admin/settings/offices/new' })}>
              Add Location
            </Button>
          }
        />
      ) : (
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant">
                {['Name', 'City', 'Timezone', 'Currency', 'Status', ''].map((h) => (
                  <th key={h} className="px-5 py-3 text-label-sm uppercase tracking-wider text-on-surface-variant">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((loc) => (
                <tr
                  key={loc.id}
                  className="border-b border-outline-variant last:border-0 bv-row-hover cursor-pointer"
                  onClick={() =>
                    navigate({ to: '/admin/organization/locations/$locationId', params: { locationId: String(loc.id) } })
                  }
                >
                  <td className="px-5 py-4 font-medium text-on-background">{loc.name}</td>
                  <td className="px-5 py-4 text-body-sm text-on-surface-variant">
                    {loc.city}, {loc.country}
                  </td>
                  <td className="px-5 py-4 text-body-sm">{loc.timezone}</td>
                  <td className="px-5 py-4 text-body-sm">{loc.currency}</td>
                  <td className="px-5 py-4">
                    <span
                      className={cn(
                        'px-2.5 py-0.5 rounded-full text-[10px] font-bold',
                        loc.is_archived
                          ? 'bg-surface-container text-on-surface-variant'
                          : 'bg-secondary/15 text-secondary',
                      )}
                    >
                      {loc.is_archived ? 'ARCHIVED' : 'ACTIVE'}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Link
                      to="/admin/organization/locations/$locationId"
                      params={{ locationId: String(loc.id) }}
                      className="text-secondary text-sm font-medium hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
