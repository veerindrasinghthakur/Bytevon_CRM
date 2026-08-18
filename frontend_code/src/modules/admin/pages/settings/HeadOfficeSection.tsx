import { useState } from 'react'
import { Button } from '@/shared/components/ui/Button'
import { cn } from '@/shared/lib/cn'

const OFFICES = [
  {
    id: 'ny',
    name: 'New York HQ',
    country: 'USA',
    city: 'New York',
    timezone: 'EST',
    currency: 'USD',
    fiscal: 'Jan-Dec',
    address: '123 Enterprise Way, Suite 500',
    postal: '10001',
  },
  {
    id: 'ldn',
    name: 'London Office',
    country: 'UK',
    city: 'London',
    timezone: 'GMT',
    currency: 'GBP',
    fiscal: 'Apr-Mar',
    address: '10 Canary Wharf',
    postal: 'E14 5AB',
  },
  {
    id: 'blr',
    name: 'Bangalore Hub',
    country: 'India',
    city: 'Bengaluru',
    timezone: 'IST',
    currency: 'INR',
    fiscal: 'Apr-Mar',
    address: 'Manyata Tech Park',
    postal: '560045',
  },
]

export function HeadOfficeSection() {
  const [pickerOpen, setPickerOpen] = useState(false)
  const [headId, setHeadId] = useState('ny')
  const head = OFFICES.find((o) => o.id === headId) ?? OFFICES[0]

  return (
    <>
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-outline-variant flex flex-wrap justify-between items-start gap-4">
          <div>
            <h3 className="text-title-lg font-semibold text-on-surface">Head Office</h3>
            <p className="text-body-sm text-on-surface-variant mt-0.5">
              Configure the organization&apos;s default headquarters.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setPickerOpen(true)}>
            Change Head Office
          </Button>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-6">
            <Readonly label="Head Office Name" value={head.name} />
            <Readonly label="Country" value={head.country} />
            <Readonly label="City" value={head.city} />
            <Readonly label="Timezone" value={head.timezone} />
            <div className="md:col-span-2">
              <Readonly label="Address" value={head.address} />
            </div>
            <Readonly label="Postal Code" value={head.postal} />
            <Readonly label="Currency" value={head.currency} />
            <Readonly label="Fiscal Year" value={head.fiscal} />
          </div>
          <p className="mt-6 text-[11px] text-on-surface-variant italic">
            The Head Office references one of the existing office locations.
          </p>
        </div>
      </div>

      {pickerOpen && (
        <>
          <div className="fixed inset-0 bg-primary/20 backdrop-blur-sm z-40" onClick={() => setPickerOpen(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-outline-variant flex items-center justify-between">
                <h3 className="text-title-lg font-semibold text-on-background">Select Head Office</h3>
                <button
                  type="button"
                  className="p-1 rounded-lg hover:bg-surface-container"
                  onClick={() => setPickerOpen(false)}
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <div className="p-4 space-y-2 max-h-[60vh] overflow-y-auto">
                {OFFICES.map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => {
                      setHeadId(o.id)
                      setPickerOpen(false)
                    }}
                    className={cn(
                      'w-full text-left px-4 py-3 rounded-lg border transition-all',
                      o.id === headId
                        ? 'border-secondary bg-secondary/10 ring-1 ring-secondary/30'
                        : 'border-outline-variant hover:bg-surface-container-low',
                    )}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-label-md font-semibold text-on-background">{o.name}</p>
                        <p className="text-body-sm text-on-surface-variant">
                          {o.city}, {o.country} · {o.timezone}
                        </p>
                      </div>
                      {o.id === headId && (
                        <span className="material-symbols-outlined text-secondary">check_circle</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
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
      <p className="text-sm font-medium text-on-surface">{value}</p>
    </div>
  )
}
