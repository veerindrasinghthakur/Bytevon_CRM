import { cn } from '@/shared/lib/cn'
import type { CaseStudy } from '../../types'
import { caseStudyStatusStyles } from '../../schemas/enums'

type Props = {
  cs: CaseStudy
  onOpen: (cs: CaseStudy) => void
  onShare: (cs: CaseStudy) => void
}

export function CaseStudyCard({ cs, onOpen, onShare }: Props) {
  return (
    <article
      className="bv-surface card-hover p-5 flex flex-col cursor-pointer"
      onClick={() => onOpen(cs)}
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
          onClick={() => onOpen(cs)}
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
            onOpen(cs)
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
            onShare(cs)
          }}
        >
          <span className="material-symbols-outlined text-[18px]">share</span>
          Share
        </button>
      </div>
    </article>
  )
}
