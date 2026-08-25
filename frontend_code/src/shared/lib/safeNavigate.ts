/**
 * TanStack Router often types route `search` as `never` when there are no
 * real search params (or when the route tree is registered loosely).
 * Typed `navigate({ to })` then fails with MakeRequiredSearchParams / ParamsReducerFn.
 *
 * Use this helper for path-only navigations so the whole module stays clean.
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
  void navigate(opts as never)
}
