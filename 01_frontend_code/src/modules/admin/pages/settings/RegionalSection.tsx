import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Select } from '@/shared/components/ui/Select'
import { regionalSchema, type RegionalForm } from '../../schemas/settings'
import {
  currencyOptions,
  dateFormatOptions,
  firstDayOptions,
  languageOptions,
  numberFormatOptions,
  timezoneOptions,
} from '../../schemas/enums'

export function RegionalSection() {
  const form = useForm<RegionalForm>({
    resolver: zodResolver(regionalSchema),
    defaultValues: {
      defaultLanguage: 'English (US)',
      defaultTimezone: 'UTC-05:00 Eastern Time',
      defaultCurrency: 'USD ($)',
      dateFormat: 'MM/DD/YYYY',
      numberFormat: '1,234.56',
      firstDayOfWeek: 'Sunday',
    },
  })

  const values = form.watch()

  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-hidden">
      <div className="px-6 py-5 border-b border-outline-variant">
        <h3 className="text-title-lg font-semibold text-on-surface">Regional Config</h3>
        <p className="text-body-sm text-on-surface-variant mt-0.5">Language, timezone, currency and formats.</p>
      </div>
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <SelectField
          label="Default Language"
          value={values.defaultLanguage}
          onChange={(v) => form.setValue('defaultLanguage', v)}
          options={languageOptions}
        />
        <SelectField
          label="Default Timezone"
          value={values.defaultTimezone}
          onChange={(v) => form.setValue('defaultTimezone', v)}
          options={timezoneOptions}
        />
        <SelectField
          label="Default Currency"
          value={values.defaultCurrency}
          onChange={(v) => form.setValue('defaultCurrency', v)}
          options={currencyOptions}
        />
        <SelectField
          label="Date Format"
          value={values.dateFormat}
          onChange={(v) => form.setValue('dateFormat', v)}
          options={dateFormatOptions}
        />
        <SelectField
          label="Number Format"
          value={values.numberFormat}
          onChange={(v) => form.setValue('numberFormat', v)}
          options={numberFormatOptions}
        />
        <SelectField
          label="First Day of Week"
          value={values.firstDayOfWeek}
          onChange={(v) => form.setValue('firstDayOfWeek', v)}
          options={firstDayOptions}
        />
      </div>
    </div>
  )
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-bold text-on-surface-variant uppercase">{label}</label>
      <Select value={value} onChange={onChange} options={options} placeholder="Select" />
    </div>
  )
}
