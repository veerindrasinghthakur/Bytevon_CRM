import { PageHeader } from '@/shared/components/layout/PageHeader'
import { Button } from '@/shared/components/ui/Button'
import { auditLogs } from '../data/mock'

export function AuditLogsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Logs"
        description="Immutable record of significant administrative and security actions."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" leftIcon={<span className="material-symbols-outlined text-[18px]">filter_list</span>}>
              Filter
            </Button>
            <Button variant="outline" size="sm" leftIcon={<span className="material-symbols-outlined text-[18px]">download</span>}>
              Export
            </Button>
          </div>
        }
      />

      <section className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-surface-container-low">
                <th className="px-6 py-3 text-label-md text-on-surface-variant uppercase tracking-wider">Time</th>
                <th className="px-6 py-3 text-label-md text-on-surface-variant uppercase tracking-wider">Actor</th>
                <th className="px-6 py-3 text-label-md text-on-surface-variant uppercase tracking-wider">Action</th>
                <th className="px-6 py-3 text-label-md text-on-surface-variant uppercase tracking-wider">Target</th>
                <th className="px-6 py-3 text-label-md text-on-surface-variant uppercase tracking-wider">Module</th>
                <th className="px-6 py-3 text-label-md text-on-surface-variant uppercase tracking-wider">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-surface-container-low">
                  <td className="px-6 py-4 text-body-sm text-on-surface-variant whitespace-nowrap">{log.timestamp}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-secondary/15 text-secondary flex items-center justify-center text-label-sm font-bold">
                        {log.actorInitials}
                      </div>
                      <span className="text-label-md text-on-background">{log.actor}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-body-md">{log.action}</td>
                  <td className="px-6 py-4 text-body-sm">{log.target}</td>
                  <td className="px-6 py-4 text-body-sm text-on-surface-variant">{log.module}</td>
                  <td className="px-6 py-4 text-body-sm font-mono text-on-surface-variant">{log.ip}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
