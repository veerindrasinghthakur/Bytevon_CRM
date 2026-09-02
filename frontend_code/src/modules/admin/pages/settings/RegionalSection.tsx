import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Select } from '@/shared/components/ui/Select'

const regionalSchema = z.object({
  defaultLanguage: z.string().default('English (US)'),
  defaultTimezone: z.string().default('UTC-05:00 Eastern Time'),
  defaultCurrency: z.string().default('USD ($)'),
  dateFormat: z.string().default('MM/DD/YYYY'),
  numberFormat: z.string().default('1,234.56'),
  firstDayOfWeek: z.string().default('Sunday'),
})

type RegionalForm = z.infer<typeof regionalSchema>

const languageOptions = [
  { value: 'English (US)', label: 'English (US)' },
  { value: 'English (UK)', label: 'English (UK)' },
  { value: 'Spanish', label: 'Spanish' },
  { value: 'French', label: 'French' },
  { value: 'German', label: 'German' },
  { value: 'Portuguese', label: 'Portuguese' },
  { value: 'Chinese', label: 'Chinese' },
  { value: 'Japanese', label: 'Japanese' },
]

const timezoneOptions = [
  { value: 'UTC-05:00 Eastern Time', label: 'UTC-05:00 Eastern Time' },
  { value: 'UTC-06:00 Central Time', label: 'UTC-06:00 Central Time' },
  { value: 'UTC-07:00 Mountain Time', label: 'UTC-07:00 Mountain Time' },
  { value: 'UTC-08:00 Pacific Time', label: 'UTC-08:00 Pacific Time' },
  { value: 'UTC+00:00 UTC', label: 'UTC+00:00 UTC' },
  { value: 'UTC+01:00 CET', label: 'UTC+01:00 CET' },
  { value: 'UTC+05:30 IST', label: 'UTC+05:30 IST' },
  { value: 'UTC+08:00 CST', label: 'UTC+08:00 CST' },
  { value: 'UTC+09:00 JST', label: 'UTC+09:00 JST' },
]

const currencyOptions = [
  { value: 'USD ($)', label: 'USD ($)' },
  { value: 'EUR (€)', label: 'EUR (€)' },
  { value: 'GBP (£)', label: 'GBP (£)' },
  { value: 'INR (₹)', label: 'INR (₹)' },
  { value: 'JPY (¥)', label: 'JPY (¥)' },
  { value: 'CNY (¥)', label: 'CNY (¥)' },
  { value: 'SGD ($)', label: 'SGD ($)' },
  { value: 'AUD ($)', label: 'AUD ($)' },
]

const dateFormatOptions = [
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
  { value: 'DD.MM.YYYY', label: 'DD.MM.YYYY' },
]

const numberFormatOptions = [
  { value: '1,234.56', label: '1,234.56 (US/UK)' },
  { value: '1.234,56', label: '1.234,56 (EU)' },
  { value: '1 234,56', label: '1 234,56 (Space)' },
  { value: '1,234.56', label: '1,234.56 (Comma)' },
]

const firstDayOptions = [
  { value: 'Sunday', label: 'Sunday' },
  { value: 'Monday', label: 'Monday' },
  { value: 'Saturday', label: 'Saturday' },
]

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

  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-hidden">
      <div className="px-6 py-5 border-b border-outline-variant">
        <h3 className="text-title-lg font-semibold text-on-surface">Regional Config</h3>
        <p className="text-body-sm text-on-surface-variant mt-0.5">Language, timezone, currency and formats.</p>
      </div>
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <SelectField
          label="Default Language"
          register={form.register('defaultLanguage')}
          options={languageOptions}
        />
        <SelectField
          label="Default Timezone"
          register={form.register('defaultTimezone')}
          options={timezoneOptions}
        />
        <SelectField
          label="Default Currency"
          register={form.register('defaultCurrency')}
          options={currencyOptions}
        />
        <SelectField
          label="Date Format"
          register={form.register('dateFormat')}
          options={dateFormatOptions}
        />
        <SelectField
          label="Number Format"
          register={form.register('numberFormat')}
          options={numberFormatOptions}
        />
        <SelectField
          label="First Day of Week"
          register={form.register('firstDayOfWeek')}
          options={firstDayOptions}
        />
      </div>
    </div>
  )
}

function SelectField({
  label,
  register,
  options,
}: {
  label: string
  register: ReturnType<typeof import('react-hook-form').useForm<RegionalForm>['register']>
  options: { value: string; label: string }[]
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-bold text-on-surface-variant uppercase">{label}</label>
      <Select {...register} options={options} placeholder="Select" />
    </div>
  )
}
