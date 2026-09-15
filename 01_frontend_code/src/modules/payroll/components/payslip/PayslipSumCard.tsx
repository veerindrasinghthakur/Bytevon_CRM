export function PayslipSumCard({
  label,
  value,
  accent,
}: {
  label: string
  value: string
  accent?: string
}) {
  return (
    <div className={`bv-surface card-hover p-5 ${accent ?? ''}`}>
      <p className="text-label-sm text-on-surface-variant mb-2">{label}</p>
      <p className="text-title-lg font-semibold text-on-background">{value}</p>
    </div>
  )
}
