/**
 * TanStack Router often types route `search` / `params` strictly when the route
 * tree is registered loosely. Typed navigate/Link/redirect then fails with
 * MakeRequiredSearchParams / ParamsReducerFn.
 *
 * Always prefer these helpers for path navigations so modules stay clean.
 */
export type NavigateFn = (opts: never) => unknown

export type SafeNavigateOpts = {
  to: string
  params?: Record<string, string>
  search?: Record<string, unknown>
  replace?: boolean
  hash?: string
}

export function safeNavigate(navigate: NavigateFn, opts: SafeNavigateOpts): void {
  void navigate({ params: {}, search: {}, ...opts } as never)
}

/** For redirect() from beforeLoad / loaders. */
export function safeRedirectOpts(opts: SafeNavigateOpts): never {
  return { params: {}, search: {}, ...opts } as never
}

/** For <Link search={...} /> / params when router types search as never. */
export function looseSearch(search?: Record<string, unknown>): never {
  return (search ?? {}) as never
}

export function looseParams(params?: Record<string, string>): never {
  return (params ?? {}) as never
}

/**
 * Spread onto <Link /> so strict MakeRequiredPathParams / search never errors
 * do not block compile. Prefer this over hand-written `as never` on each Link.
 *
 * Returns a concrete `any` (double-cast) so TS never narrows the spread props
 * back to a partial Link props object missing required params/search.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function looseLinkProps(opts: {
  to: string
  params?: Record<string, string>
  search?: Record<string, unknown>
  className?: string
  // allow extra Link props without listing every one
  [key: string]: unknown
}): any {
  // Explicit `as any` on the object — return-type annotation alone is not always
  // enough when the result is spread into a generic Link component.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return { params: {}, search: {}, ...opts } as any
}
