import { TableSkeleton } from '@/shared/components/feedback/Skeleton'
import { RowActions } from '@/shared/components/ui/RowActions'
import { cn } from '@/shared/lib/cn'
import type { LeadSource } from '../../api/source'

type Props = {
  rows: LeadSource[]
  isLoading: boolean
  isFetching: boolean
  onEdit: (row: LeadSource) => void
  onDelete: (row: LeadSource) => void
  onRestore: (row: LeadSource) => void
}

export function SourcesTable({ rows, isLoading, isFetching, onEdit, onDelete, onRestore }: Props) {
  return (
    <div className="bv-surface overflow-hidden relative">
      {(isLoading || isFetching) && (
        <div className="absolute inset-0 z-10 bg-surface-container-lowest/70 backdrop-blur-[1px]">
          <TableSkeleton rows={5} />
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-outline-variant bg-surface-container-low/50">
              <th className="px-4 py-3 text-label-sm font-semibold text-on-surface-variant uppercase tracking-wider">
                Source
              </th>
              <th className="px-4 py-3 text-label-sm font-semibold text-on-surface-variant uppercase tracking-wider">
                Description
              </th>
              <th className="px-4 py-3 text-label-sm font-semibold text-on-surface-variant uppercase tracking-wider">
                Leads
              </th>
              <th className="px-4 py-3 text-label-sm font-semibold text-on-surface-variant uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-label-sm font-semibold text-on-surface-variant uppercase tracking-wider text-center">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant">
            {rows.map((row) => (
              <tr key={row.id} className="zebra-row group">
                <td className="px-4 py-4">
                  <p className="font-semibold text-on-surface">{row.name}</p>
                  <p className="text-xs text-on-surface-variant font-mono">#{row.id}</p>
                </td>
                <td className="px-4 py-4 text-body-sm text-on-surface-variant max-w-md">
                  {row.description || '—'}
                </td>
                <td className="px-4 py-4 font-semibold text-on-surface">{row.leadCount}</td>
                <td className="px-4 py-4">
                  <span
                    className={cn(
                      'px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase',
                      row.isArchived
                        ? 'status-badge status-neutral'
                        : 'status-badge status-success',
                    )}
                  >
                    {row.status}
                  </span>
                </td>
                <td className="px-4 py-4 text-center">
                  <div className="flex justify-center">
                    <RowActions
                      label={`Actions for ${row.name}`}
                      actions={[
                        {
                          id: 'edit',
                          label: 'Edit',
                          icon: 'edit',
                          onClick: () => onEdit(row),
                          disabled: row.isArchived,
                        },
                        {
                          id: 'delete',
                          label: 'Delete',
                          icon: 'delete',
                          onClick: () => onDelete(row),
                          disabled: row.isArchived,
                        },
                        ...(row.isArchived
                          ? [
                              {
                                id: 'restore',
                                label: 'Restore',
                                icon: 'restore_from_trash',
                                onClick: () => onRestore(row),
                              },
                            ]
                          : []),
                      ]}
                    />
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && !isLoading && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-body-sm text-on-surface-variant">
                  No sources found. Click “Add source” to create one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
