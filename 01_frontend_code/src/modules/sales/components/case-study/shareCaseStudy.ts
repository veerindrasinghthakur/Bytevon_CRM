import type { CaseStudy } from '../../types'

export async function shareCaseStudy(cs: CaseStudy) {
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
