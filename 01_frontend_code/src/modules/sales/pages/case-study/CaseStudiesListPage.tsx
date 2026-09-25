import { Link } from '@tanstack/react-router'
import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { ListToolbar } from '@/shared/components/layout/ListToolbar'
import { Select } from '@/shared/components/ui/Select'
import { Pagination } from '@/shared/components/ui/Pagination'
import { TableSkeleton } from '@/shared/components/feedback/Skeleton'
import { ErrorState } from '@/shared/components/feedback/ErrorState'
import { useQuickOverview } from '@/shared/components/layout/QuickOverview'
import { looseLinkProps } from '@/shared/lib/safeNavigate'
import { useCaseStudiesList } from '../../hooks/case-study/use-case-studies'
import type { CaseStudy } from '../../types'
import { salesRoutes } from '../../routes'
import { caseStudyStatusDot, CaseStudyStatusOptions } from '../../schemas/enums'
import { CaseStudyQuickContent } from '../../components/case-study/CaseStudyQuickContent'
import { CaseStudyMetricsCards } from '../../components/case-study/CaseStudyMetricsCards'
import { CaseStudyCard } from '../../components/case-study/CaseStudyCard'
import { shareCaseStudy } from '../../components/case-study/shareCaseStudy'
import { Can } from '@/shared/rbac'
import { Action } from '@/shared/schema'
import { ExportButton } from '@/shared/components/export/ExportButton'

export function CaseStudiesListPage() {
  const { openPanel } = useQuickOverview()
  const {
    filtered,
    totalCount,
    metrics,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    filtersActive,
    resetFilters,
    page,
    setPage,
    pageSize,
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
            <Link {...looseLinkProps({ to: salesRoutes.root, className: 'hover:text-secondary' })}>
              Sales
            </Link>
            <span className="mx-2">/</span>
            <span className="text-on-surface">Case Studies</span>
          </nav>
        }
        actions={
          <div className="flex items-center gap-2">
            <ExportButton
              resource="lead"
              filenameStem="case-studies"
            />
            <Can action={Action.CREATE} resource="lead">
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
            </Can>
          </div>
        }
      />

      <CaseStudyMetricsCards metrics={metrics} />

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
            ...CaseStudyStatusOptions,
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
            <CaseStudyCard
              key={cs.id}
              cs={cs}
              onOpen={openCaseStudyOverview}
              onShare={shareCaseStudy}
            />
          ))}
        </div>
        <Pagination
          page={page}
          pageSize={pageSize}
          total={totalCount}
          onPageChange={setPage}
          itemLabel="case studies"
        />
      </div>
    </div>
  )
}
