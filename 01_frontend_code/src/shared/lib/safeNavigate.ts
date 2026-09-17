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

/** Spread on <Link> when router types search/params strictly. */
export function looseLinkProps<T extends { to: string; className?: string; search?: Record<string, unknown>; params?: Record<string, string> }>(props: T): Omit<T, 'search' | 'params'> & { search: never; params: never } {
  return { ...props, search: undefined as never, params: undefined as never }
}
