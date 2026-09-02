import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Select } from '@/shared/components/ui/Select'
import { Button } from '@/shared/components/ui/Button'

const brandingSchema = z.object({
  primaryColor: z.string().default('var(--color-primary)'),
  secondaryColor: z.string().default('var(--color-secondary)'),
})

type BrandingForm = z.infer<typeof brandingSchema>

const colorOptions = [
  { value: 'var(--color-primary)', label: 'Primary (--color-primary)' },
  { value: 'var(--color-secondary)', label: 'Secondary (--color-secondary)' },
  { value: 'var(--color-tertiary)', label: 'Tertiary (--color-tertiary)' },
  { value: '#2563eb', label: 'Blue 600' },
  { value: '#16a34a', label: 'Green 600' },
  { value: '#ea580c', label: 'Orange 600' },
  { value: '#9333ea', label: 'Purple 600' },
  { value: '#dc2626', label: 'Red 600' },
  { value: '#0891b2', label: 'Cyan 600' },
  { value: '#db2777', label: 'Pink 600' },
]

export function BrandingSection() {
  const form = useForm<BrandingForm>({
    resolver: zodResolver(brandingSchema),
    defaultValues: {
      primaryColor: 'var(--color-primary)',
      secondaryColor: 'var(--color-secondary)',
    },
  })

  const values = form.watch()

  const getColorPreview = (color: string) => {
    if (color.startsWith('var(')) return 'var(--color-primary)'
    return color
  }

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
              <div
                className="w-8 h-8 rounded border border-outline-variant"
                style={{ backgroundColor: getColorPreview(values.primaryColor) }}
              />
              <Select
                {...form.register('primaryColor')}
                options={colorOptions}
                placeholder="Select primary color"
                className="flex-1"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-on-surface-variant uppercase">Secondary Color</label>
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded border border-outline-variant"
                style={{ backgroundColor: getColorPreview(values.secondaryColor) }}
              />
              <Select
                {...form.register('secondaryColor')}
                options={colorOptions}
                placeholder="Select secondary color"
                className="flex-1"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
