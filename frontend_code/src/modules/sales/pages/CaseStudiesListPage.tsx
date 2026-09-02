import { Link } from '@tanstack/react-router'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { ListToolbar } from '@/shared/components/layout/ListToolbar'
import { Select } from '@/shared/components/ui/Select'
import { TableSkeleton } from '@/shared/components/feedback/Skeleton'
import { ErrorState } from '@/shared/components/feedback/ErrorState'
import { useQuickOverview } from '@/shared/components/layout/QuickOverview'
import {
  QuickSection,
  QuickStat,
  QuickStatGrid,
  QuickMetaTile,
  QuickRelatedRow,
} from '@/shared/components/layout/QuickOverviewParts'
import { useCaseStudiesList } from '../hooks/use-case-studies-list'
import type { CaseStudy } from '../types'
import { cn } from '@/shared/lib/cn'
import { salesRoutes } from '../routes'
import { caseStudyStatusStyles, caseStudyStatusDot } from '../schemas/cssTokens'
import { CaseStudyStatusValues } from '../schemas/enums'

async function shareCaseStudy(cs: CaseStudy) {
  const payload = {
    title: cs.title,
    text: cs.summary ?? `${cs.customer} · ${cs.industry}`,
    url: typeof window !== 'undefined' ? window.location.href : '',
  }
  try {
    if (typeof navigator !== 'undefined' && navigator.share) {
      await navigator.share(payload)
      return
    }
  } catch {
    /* fall through to clipboard */
  }
  try {
    await navigator.clipboard.writeText(`${payload.title}\n${payload.text}\n${payload.url}`)
  } catch {
    /* ignore */
  }
}

function CaseStudyQuickContent({ cs }: { cs: CaseStudy }) {
  return (
    <>
      <QuickSection title="Impact">
        <QuickStatGrid>
          <QuickStat icon="trending_up" value={cs.impact} label="Impact" />
          <QuickStat icon="payments" value={cs.revenue} label="Revenue" />
          <QuickStat icon="factory" value={cs.industry} label="Industry" />
        </QuickStatGrid>
      </QuickSection>
      <QuickSection title="Customer">
        <div className="grid grid-cols-2 gap-3">
          <QuickMetaTile icon="apartment" label="Customer" value={cs.customer} />
          <QuickMetaTile
            icon="flag"
            label="Status"
            value={<span className={caseStudyStatusStyles[cs.status]}>{cs.status}</span>}
          />
        </div>
      </QuickSection>
      {cs.summary && (
        <QuickSection title="Summary">
          <p className="text-body-sm text-on-surface-variant leading-relaxed">{cs.summary}</p>
        </QuickSection>
      )}
      {cs.tags?.length > 0 && (
        <QuickSection title="Tags">
          <QuickRelatedRow icon="label" label="Tags" value={cs.tags.join(', ')} />
        </QuickSection>
      )}
    </>
  )
}

export function CaseStudiesListPage() {
  const { openPanel } = useQuickOverview()
  const {
    filtered,
    metrics,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    filtersActive,
    resetFilters,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useCaseStudiesList()

  const openCaseStudyOverview = (cs: CaseStudy) => {
    openPanel({
      title: cs.title,
      subtitle: `${cs.customer} · ${cs.industry}`,
      icon: 'menu_book',
      status: cs.status,
      statusDotClass: caseStudyStatusDot[cs.status],
      content: <CaseStudyQuickContent cs={cs} />,
      widthClass: 'max-w-[520px]',
    })
  }

  if (isError) {
    return (
      <ErrorState
        title="Could not load case studies"
        description="Case studies failed to load. Retry or go back."
        onRetry={() => void refetch()}
      />
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Case Study Management"
        description="Published wins and drafts used in sales conversations."
        breadcrumbs={
          <nav className="text-body-sm text-on-surface-variant">
            <Link to={salesRoutes.root} className="hover:text-secondary">
              Sales
            </Link>
            <span className="mx-2">/</span>
            <span className="text-on-surface">Case Studies</span>
          </nav>
        }
        actions={
          <Button
            variant="primary"
            leftIcon={<span className="material-symbols-outlined text-lg">add</span>}
            onClick={() =>
              openCaseStudyOverview({
                id: 'new',
                title: 'New case study',
                customer: '—',
                industry: '—',
                status: 'Draft',
                impact: '—',
                revenue: '—',
                tags: [],
                summary: 'Create flow not wired yet — use overview for drafts.',
              })
            }
          >
            New case study
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m) => (
          <div key={m.id} className="bv-surface card-hover p-5">
            <div className="flex justify-between items-start mb-2">
              <span className="p-2 rounded-lg bg-secondary/10 text-secondary">
                <span className="material-symbols-outlined text-xl">{m.icon}</span>
              </span>
              {m.change && (
                <span
                  className={cn(
                    'text-[10px] font-bold px-2 py-0.5 rounded',
                    m.changeType === 'positive'
                      ? 'status-badge status-success'
                      : 'status-badge status-neutral',
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

      <ListToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search case studies..."
        filtersActive={filtersActive}
        onResetFilters={resetFilters}
        onRefresh={() => void refetch()}
      >
        <Select
          value={statusFilter}
          onChange={setStatusFilter}
          placeholder="All status"
          options={[
            { value: 'All', label: 'All status' },
            ...CaseStudyStatusValues.map((s) => ({ value: s, label: s })),
          ]}
          minWidthClass="min-w-[140px]"
        />
      </ListToolbar>

      <div className="relative min-h-[120px]">
        {(isLoading || isFetching) && (
          <div className="absolute inset-0 z-10 bg-surface/70 backdrop-blur-[1px] rounded-xl">
            <TableSkeleton rows={3} />
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((cs) => (
            <article
              key={cs.id}
              className="bv-surface card-hover p-5 flex flex-col cursor-pointer"
              onClick={() => openCaseStudyOverview(cs)}
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <h3 className="font-semibold text-on-surface text-title-md leading-snug">{cs.title}</h3>
                <span className={cn('shrink-0', caseStudyStatusStyles[cs.status])}>{cs.status}</span>
              </div>
              <p className="text-body-sm text-on-surface-variant mb-3">
                {cs.customer} · {cs.industry}
              </p>
              {cs.summary && <p className="text-body-sm text-on-surface line-clamp-3 mb-3">{cs.summary}</p>}
              <div className="flex items-center justify-between text-sm mb-3">
                <span className="font-semibold text-secondary">{cs.impact}</span>
                <span className="font-bold text-on-background">{cs.revenue}</span>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-4">
                {cs.tags.map((t) => (
                  <span
                    key={t}
                    className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-surface-container text-on-surface-variant"
                  >
                    {t}
                  </span>
                ))}
              </div>

              <div
                className="mt-auto pt-3 border-t border-outline-variant/40 flex items-center gap-1"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-label-sm font-medium text-on-surface-variant hover:bg-surface-container-low hover:text-secondary transition-colors"
                  title="Quick view"
                  onClick={() => openCaseStudyOverview(cs)}
                >
                  <span className="material-symbols-outlined text-[18px]">visibility</span>
                  View
                </button>
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-label-sm font-medium text-on-surface-variant hover:bg-surface-container-low hover:text-secondary transition-colors"
                  title="Edit case study"
                  onClick={(e) => {
                    e.stopPropagation()
                    openCaseStudyOverview(cs)
                  }}
                >
                  <span className="material-symbols-outlined text-[18px]">edit</span>
                  Edit
                </button>
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-label-sm font-medium text-on-surface-variant hover:bg-surface-container-low hover:text-secondary transition-colors ml-auto"
                  title="Share case study"
                  onClick={(e) => {
                    e.stopPropagation()
                    void shareCaseStudy(cs)
                  }}
                >
                  <span className="material-symbols-outlined text-[18px]">share</span>
                  Share
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  )
}
