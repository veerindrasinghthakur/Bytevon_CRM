/**
 * Lazy page wrapper for TanStack Router — named exports + shared loading skeleton.
 * Use for large/rarely-visited module pages. Keep URLs and route trees unchanged.
 */
import { lazy, Suspense, type ComponentType } from 'react'
import { PageLoadingSkeleton } from '@/shared/components/feedback/PageLoadingSkeleton'

export function lazyPage<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  M extends Record<string, ComponentType<any>>,
  K extends keyof M & string,
>(factory: () => Promise<M>, exportName: K) {
  const Lazy = lazy(async () => {
    const mod = await factory()
    const Comp = mod[exportName]
    if (!Comp) {
      const keys = Object.keys(mod).join(', ') || '(none)'
      throw new Error(
        `[lazyPage] Export "${exportName}" not found in module. Available: ${keys}`,
      )
    }
    return { default: Comp as ComponentType<Record<string, unknown>> }
  })

  function LazyPageRoute(props: Record<string, unknown>) {
    return (
      <Suspense fallback={<PageLoadingSkeleton />}>
        <Lazy {...props} />
      </Suspense>
    )
  }
  LazyPageRoute.displayName = `Lazy(${exportName})`
  return LazyPageRoute
}
