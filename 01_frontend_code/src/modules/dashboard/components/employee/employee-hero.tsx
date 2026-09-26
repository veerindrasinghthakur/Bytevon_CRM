export function EmployeeHero({
  greeting,
  displayName,
  employeeId,
  department,
  todayLabel,
  shift,
}: {
  greeting: string
  displayName: string
  employeeId: string
  department: string
  todayLabel: string
  shift: string
}) {
  return (
    <section className="relative overflow-hidden bg-deep-navy rounded-xl p-8 text-on-primary executive-shadow">
      <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-headline-lg font-bold mb-2">{greeting}, {displayName}</h2>
          <div className="flex flex-wrap gap-3 text-inverse-primary">
            <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full text-label-md">
              <span className="material-symbols-outlined text-[18px]">badge</span> {employeeId}
            </span>
            <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full text-label-md">
              <span className="material-symbols-outlined text-[18px]">business_center</span> {department}
            </span>
            <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full text-label-md">
              <span className="material-symbols-outlined text-[18px]">calendar_month</span> {todayLabel}
            </span>
          </div>
        </div>
        <div className="bg-secondary/20 backdrop-blur-sm border border-secondary/30 p-4 rounded-xl flex items-center gap-4">
          <div className="bg-secondary p-2 rounded-lg">
            <span className="material-symbols-outlined text-on-secondary">schedule</span>
          </div>
          <div>
            <span className="text-label-sm opacity-80 uppercase tracking-wider">Current Shift</span>
            <p className="text-title-lg">{shift}</p>
          </div>
        </div>
      </div>
    </section>
  )
}
