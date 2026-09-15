import {
  QuickSection,
  QuickStat,
  QuickStatGrid,
  QuickMetaTile,
  QuickRelatedRow,
} from '@/shared/components/layout/QuickOverviewParts'
import type { CaseStudy } from '../../types'
import { caseStudyStatusStyles } from '../../schemas/enums'

export function CaseStudyQuickContent({ cs }: { cs: CaseStudy }) {
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
