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
    return { default: mod[exportName] as ComponentType<any> }
  })

  function LazyPageRoute(props: Record<string, unknown>) {
    return (
      <Suspense fallback={<PageLoadingSkeleton />}>
        {/* @ts-expect-error - dynamic router component prop forwarding */}
        <Lazy {...props} />
      </Suspense>
    )
  }
  LazyPageRoute.displayName = `Lazy(${exportName})`
  return LazyPageRoute
}
