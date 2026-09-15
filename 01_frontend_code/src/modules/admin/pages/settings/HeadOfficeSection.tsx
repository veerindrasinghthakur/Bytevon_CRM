import { Button } from '@/shared/components/ui/Button'
import { ErrorState } from '@/shared/components/feedback/ErrorState'
import { cn } from '@/shared/lib/cn'
import { useHeadOfficePicker } from '../../hooks/settings/use-head-office'

export function HeadOfficeSection() {
  const {
    offices,
    pickerOpen,
    head,
    isLoading,
    isError,
    isSaving,
    error,
    openPicker,
    closePicker,
    selectOffice,
    refetch,
  } = useHeadOfficePicker()

  if (isError && !isLoading) {
    return (
      <ErrorState
        title="Could not load head office"
        description={error ?? 'Check that locations and organization settings APIs are reachable.'}
        onRetry={() => void refetch()}
        showBack={false}
      />
    )
  }

  return (
    <>
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-outline-variant flex flex-wrap justify-between items-start gap-4">
          <div>
            <h3 className="text-title-lg font-semibold text-on-surface">Head Office</h3>
            <p className="text-body-sm text-on-surface-variant mt-0.5">
              Choose one organization location as headquarters (saved on organization settings).
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={openPicker}
            disabled={isLoading || offices.length === 0 || isSaving}
          >
            {isSaving ? 'Saving…' : 'Change Head Office'}
          </Button>
        </div>
        <div className="p-6">
          {isLoading ? (
            <p className="text-body-sm text-on-surface-variant">Loading locations…</p>
          ) : offices.length === 0 ? (
            <div className="space-y-2">
              <p className="text-body-sm text-on-surface-variant">
                No locations found. Create a location under Organization → Locations first, then assign it
                here.
              </p>
            </div>
          ) : !head ? (
            <div className="space-y-3">
              <p className="text-body-sm text-on-surface-variant">
                No head office selected yet. Pick a location to assign as headquarters.
              </p>
              <Button variant="primary" size="sm" onClick={openPicker}>
                Select Head Office
              </Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-6">
                <Readonly label="Head Office Name" value={head.name} />
                <Readonly label="Country" value={head.country} />
                <Readonly label="State" value={head.state} />
                <Readonly label="City" value={head.city} />
                <Readonly label="Timezone" value={head.timezone} />
                <div className="md:col-span-2">
                  <Readonly label="Address" value={head.address} />
                </div>
                <Readonly label="Currency" value={head.currency} />
                <Readonly label="Fiscal Year" value={head.fiscal} />
              </div>
              <p className="mt-6 text-[11px] text-on-surface-variant italic">
                Stored as organization settings <code>head_office_location_id</code> = {head.id}.
              </p>
            </>
          )}
          {error && !isError && (
            <p className="mt-4 text-body-sm text-error flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">error</span>
              {error}
            </p>
          )}
        </div>
      </div>

      {pickerOpen && (
        <>
          <div className="fixed inset-0 bg-primary/20 backdrop-blur-sm z-40" onClick={closePicker} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-outline-variant flex items-center justify-between">
                <h3 className="text-title-lg font-semibold text-on-background">Select Head Office</h3>
                <button
                  type="button"
                  className="p-1 rounded-lg hover:bg-surface-container"
                  onClick={closePicker}
                  disabled={isSaving}
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <div className="p-4 space-y-2 max-h-[60vh] overflow-y-auto">
                {offices.length === 0 && (
                  <p className="text-body-sm text-on-surface-variant px-2 py-4 text-center">
                    No locations available.
                  </p>
                )}
                {offices.map((o) => {
                  const isCurrent = String(o.id) === String(head?.id)
                  return (
                    <button
                      key={o.id}
                      type="button"
                      disabled={isSaving}
                      onClick={() => selectOffice(o.id)}
                      className={cn(
                        'w-full text-left px-4 py-3 rounded-lg border transition-all',
                        isCurrent
                          ? 'border-secondary bg-secondary/10 ring-1 ring-secondary/30'
                          : 'border-outline-variant hover:bg-surface-container-low',
                        isSaving && 'opacity-60 cursor-wait',
                      )}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-label-md font-semibold text-on-background">{o.name}</p>
                          <p className="text-body-sm text-on-surface-variant">
                            {[o.city, o.state, o.country].filter(Boolean).join(', ')} · {o.timezone}
                          </p>
                        </div>
                        {isCurrent && (
                          <span className="material-symbols-outlined text-secondary">check_circle</span>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
              {isSaving && (
                <div className="px-6 py-3 border-t border-outline-variant text-body-sm text-on-surface-variant">
                  Saving head office…
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  )
}

function Readonly({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-[10px] font-bold text-on-surface-variant uppercase">{label}</p>
      <p className="text-sm font-medium text-on-surface">{value || '—'}</p>
    </div>
  )
}
