import { useMemo, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { caseStudies, caseStudyMetrics } from '../data/mock'
import type { CaseStudyStatus } from '../types'
import { cn } from '@/shared/lib/cn'

const statusStyles: Record<CaseStudyStatus, string> = {
  Published: 'bg-emerald-100 text-emerald-800',
  Draft: 'bg-amber-100 text-amber-800',
  Archived: 'bg-slate-100 text-slate-600',
}

export function CaseStudiesListPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('All')

  const filtered = useMemo(() => {
    return caseStudies.filter((cs) => {
      const q = search.toLowerCase()
      const matchSearch =
        !q ||
        cs.title.toLowerCase().includes(q) ||
        cs.customer.toLowerCase().includes(q) ||
        cs.industry.toLowerCase().includes(q)
      const matchStatus = statusFilter === 'All' || cs.status === statusFilter
      return matchSearch && matchStatus
    })
  }, [search, statusFilter])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Case Study Management"
        description="Published wins and drafts used in sales conversations."
        breadcrumbs={
          <nav className="text-body-sm text-on-surface-variant">
            <Link to="/sales" className="hover:text-secondary">
              Sales
            </Link>
            <span className="mx-2">/</span>
            <span className="text-on-surface">Case Studies</span>
          </nav>
        }
        actions={
          <Button variant="primary" leftIcon={<span className="material-symbols-outlined text-lg">add</span>}>
            New case study
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {caseStudyMetrics.map((m) => (
          <div key={m.id} className="p-5 rounded-xl border border-outline-variant bg-surface-container-lowest shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <span className="p-2 rounded-lg bg-secondary/10 text-secondary">
                <span className="material-symbols-outlined text-xl">{m.icon}</span>
              </span>
              {m.change && (
                <span
                  className={cn(
                    'text-[10px] font-bold px-2 py-0.5 rounded',
                    m.changeType === 'positive' ? 'text-emerald-700 bg-emerald-50' : 'text-on-surface-variant bg-surface-container'
                  )}
                >
                  {m.change}
                </span>
              )}
            </div>
            <p className="text-label-md text-on-surface-variant">{m.label}</p>
            <h3 className="text-headline-md font-bold mt-0.5">{m.value}</h3>
            {m.subtitle && <p className="text-[11px] text-on-surface-variant mt-1">{m.subtitle}</p>}
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3 bg-surface-container-low p-4 rounded-xl border border-outline-variant">
        <div className="relative flex-1 min-w-[200px]">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
            search
          </span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg text-body-sm outline-none focus:ring-2 focus:ring-secondary/30"
            placeholder="Search case studies..."
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2 text-label-sm outline-none"
        >
          <option value="All">All status</option>
          <option value="Published">Published</option>
          <option value="Draft">Draft</option>
          <option value="Archived">Archived</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((cs) => (
          <article
            key={cs.id}
            className="rounded-xl border border-outline-variant bg-surface-container-lowest p-5 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between gap-2 mb-3">
              <h3 className="font-semibold text-on-surface text-title-md leading-snug">{cs.title}</h3>
              <span className={cn('shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase', statusStyles[cs.status])}>
                {cs.status}
              </span>
            </div>
            <p className="text-body-sm text-on-surface-variant mb-3">
              {cs.customer} · {cs.industry}
            </p>
            {cs.summary && <p className="text-body-sm text-on-surface line-clamp-3 mb-3">{cs.summary}</p>}
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold text-secondary">{cs.impact}</span>
              <span className="font-bold text-on-background">{cs.revenue}</span>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-3">
              {cs.tags.map((t) => (
                <span key={t} className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-surface-container text-on-surface-variant">
                  {t}
                </span>
              ))}
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
