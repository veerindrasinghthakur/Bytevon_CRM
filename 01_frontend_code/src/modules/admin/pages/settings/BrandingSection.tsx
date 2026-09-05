import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Select } from '@/shared/components/ui/Select'
import { brandingSchema, type BrandingForm } from '../../schemas/settings'
import { colorOptions } from '../../schemas/enums'

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
                className="w-8 h-8 rounded border border-outline-variant shrink-0"
                style={{ backgroundColor: getColorPreview(values.primaryColor) }}
              />
              <Select
                value={values.primaryColor}
                onChange={(v) => form.setValue('primaryColor', v, { shouldValidate: true })}
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
                className="w-8 h-8 rounded border border-outline-variant shrink-0"
                style={{ backgroundColor: getColorPreview(values.secondaryColor) }}
              />
              <Select
                value={values.secondaryColor}
                onChange={(v) => form.setValue('secondaryColor', v, { shouldValidate: true })}
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
