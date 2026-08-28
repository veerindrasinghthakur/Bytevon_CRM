export function BrandingSection() {
  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-hidden">
      <div className="px-6 py-5 border-b border-outline-variant">
        <h3 className="text-title-lg font-semibold text-on-surface">Branding</h3>
        <p className="text-body-sm text-on-surface-variant mt-0.5">Customize the organization&apos;s branding.</p>
      </div>
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-on-surface-variant uppercase">Organization Logo</label>
            <button
              type="button"
              className="w-full py-2 border border-dashed border-outline-variant rounded-lg text-xs font-medium hover:border-secondary transition-all"
            >
              Upload Logo
            </button>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-on-surface-variant uppercase">Favicon</label>
            <button
              type="button"
              className="w-full py-2 border border-dashed border-outline-variant rounded-lg text-xs font-medium hover:border-secondary transition-all"
            >
              Upload Icon
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-on-surface-variant uppercase">Primary Color</label>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-primary border border-outline-variant" />
              <input
                className="flex-1 text-xs border border-outline-variant rounded px-2 py-1.5 outline-none focus:border-secondary"
                defaultValue="var(--color-primary)"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-on-surface-variant uppercase">Secondary Color</label>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-secondary border border-outline-variant" />
              <input
                className="flex-1 text-xs border border-outline-variant rounded px-2 py-1.5 outline-none focus:border-secondary"
                defaultValue="var(--color-secondary)"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
