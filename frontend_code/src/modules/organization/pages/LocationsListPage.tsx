import { useMemo, useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { Button } from '@/shared/components/ui/Button'
import { PageLoadingSkeleton } from '@/shared/components/feedback/PageLoadingSkeleton'
import { EmptyState } from '@/shared/components/feedback/EmptyState'
import { ErrorState } from '@/shared/components/feedback/ErrorState'
import { useQuickOverview } from '@/shared/components/layout/QuickOverview'
import {
  QuickSection,
  QuickStat,
  QuickStatGrid,
  QuickMetaTile,
  QuickRelatedRow,
} from '@/shared/components/layout/QuickOverviewParts'
import { useLocationsList } from '../hooks/use-locations'
import type { LocationRow } from '@/shared/schema'
import { cn } from '@/shared/lib/cn'

function LocationQuickContent({ loc }: { loc: LocationRow }) {
  return (
    <>
      <QuickSection title="Overview">
        <QuickStatGrid>
          <QuickStat icon="public" value={loc.country} label="Country" />
          <QuickStat icon="location_city" value={loc.city} label="City" />
          <QuickStat icon="schedule" value={loc.timezone} label="Timezone" />
        </QuickStatGrid>
      </QuickSection>
      <QuickSection title="Details">
        <div className="grid grid-cols-2 gap-3">
          <QuickMetaTile icon="payments" label="Currency" value={loc.currency} />
          <QuickMetaTile
            icon="flag"
            label="Status"
            value={loc.is_archived ? 'Archived' : 'Active'}
          />
        </div>
      </QuickSection>
      <QuickSection title="Identity">
        <QuickRelatedRow icon="apartment" label="Name" value={loc.name} />
        <QuickRelatedRow icon="tag" label="ID" value={String(loc.id)} />
      </QuickSection>
    </>
  )
}

export function LocationsListPage() {
  const navigate = useNavigate()
  const { openPanel } = useQuickOverview()
  const { data, isLoading, isError, error, refetch } = useLocationsList(true)
  const [q, setQ] = useState('')
  const items = data?.items ?? []

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

  const openLocationOverview = (loc: LocationRow) => {
    openPanel({
      title: loc.name,
      subtitle: `${loc.city}, ${loc.country}`,
      icon: 'location_on',
      status: loc.is_archived ? 'Archived' : 'Active',
      statusDotClass: loc.is_archived ? 'bg-slate-400' : 'bg-emerald-500',
      content: <LocationQuickContent loc={loc} />,
      fullRecordLabel: 'Open full record',
      onOpenFull: () =>
        navigate({
          to: '/admin/settings/locations/$locationId',
          params: { locationId: String(loc.id) },
        }),
      widthClass: 'max-w-[520px]',
    })
  }

  if (isLoading) return <PageLoadingSkeleton />
  if (isError) {
    return <ErrorState description={(error as Error).message} onRetry={() => void refetch()} />
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-title-lg font-semibold text-on-background">Office Locations</h2>
          <p className="text-body-sm text-on-surface-variant mt-0.5">
            Manage office locations for the organization
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
              search
            </span>
            <input
              className="w-[220px] pl-9 pr-4 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-lg text-body-sm focus:outline-none focus:border-secondary shadow-sm"
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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Active Offices', value: active },
          { label: 'Archived Offices', value: archived },
          { label: 'Timezones', value: new Set(items.map((l) => l.timezone)).size },
          { label: 'Currencies', value: new Set(items.map((l) => l.currency)).size },
        ].map((k) => (
          <div key={k.label} className="bv-surface p-5 card-hover">
            <span className="text-label-sm text-on-surface-variant uppercase tracking-wider">{k.label}</span>
            <p className="text-display-lg font-bold text-on-background mt-1">{k.value}</p>
          </div>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No locations"
          description="Add an office location to configure attendance radius, timezone, and payroll region."
          actionLabel="Add Location"
          onAction={() => navigate({ to: '/admin/settings/offices/new' })}
        />
      ) : (
        <div className="bv-surface overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant">
                {['Name', 'City', 'Timezone', 'Currency', 'Status', ''].map((h) => (
                  <th
                    key={h || 'actions'}
                    className="px-5 py-3 text-label-sm uppercase tracking-wider text-on-surface-variant"
                  >
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
                  onClick={() => openLocationOverview(loc)}
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
                  <td className="px-5 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                    <Link
                      to="/admin/settings/locations/$locationId"
                      params={{ locationId: String(loc.id) }}
                      className="text-secondary text-sm font-medium hover:underline"
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
