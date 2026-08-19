export function RegionalSection() {
  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-hidden">
      <div className="px-6 py-5 border-b border-outline-variant">
        <h3 className="text-title-lg font-semibold text-on-surface">Regional Config</h3>
        <p className="text-body-sm text-on-surface-variant mt-0.5">Language, timezone, currency and formats.</p>
      </div>
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <SelectField label="Default Language" value="English (US)" />
        <SelectField label="Default Timezone" value="UTC-05:00 Eastern Time" />
        <SelectField label="Default Currency" value="USD ($)" />
        <SelectField label="Date Format" value="MM/DD/YYYY" />
        <SelectField label="Number Format" value="1,234.56" />
        <SelectField label="First Day of Week" value="Sunday" />
      </div>
    </div>
  )
}

function SelectField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-bold text-on-surface-variant uppercase">{label}</label>
      <select className="w-full bg-white border border-outline-variant rounded px-3 py-2 text-sm outline-none focus:border-secondary">
        <option>{value}</option>
      </select>
    </div>
  )
}
