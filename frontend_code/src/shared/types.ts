import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from 'react'
import type { ExportFormat } from '@/shared/api/export'
import type { NoteReferenceType } from '@/shared/schema'

export interface SecondaryNavItem {
  id: string
  label: string
  icon: string
  to: string
  badge?: number | string
  visible?: boolean
}

export interface SecondaryNavGroup {
  moduleId: string
  title: string
  items: SecondaryNavItem[]
}

export interface RailItem {
  id: string
  icon: string
  label: string
  to: string
  visible?: boolean
}

export interface MetricCardBase {
  id: string
  label: string
  value: string
  subtitle?: string
  change?: string
  changeType?: 'positive' | 'negative' | 'neutral'
  icon: string
}

export interface UseListSelectionOptions<T> {
  items: T[]
  getId: (item: T) => string
}

export interface UseListSelectionResult {
  selectionMode: boolean
  selectedIds: Set<string>
  selectedCount: number
  allFilteredSelected: boolean
  isSelected: (id: string) => boolean
  toggleSelectAllFiltered: () => void
  toggleOne: (id: string) => void
  enterSelectionWith: (id: string) => void
  exitSelectionMode: () => void
  onRowPressStart: (id: string) => void
  onRowPressEnd: (id: string, onShortPress?: () => void) => void
  onRowPressCancel: () => void
}

export interface FilePreviewItem {
  id: string | number
  name: string
  mimeType?: string
  sizeLabel?: string
  uploadedBy?: string
  uploadedAt?: string
  url?: string
  blob?: Blob
}

export interface FilePreviewModalProps {
  open: boolean
  file: FilePreviewItem | null
  onClose: () => void
  className?: string
}

export interface ExportDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: (format: ExportFormat) => void
  isExporting?: boolean
  errorMessage?: string | null
  contextLabel?: string
  title?: string
}

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg'

export interface EmptyStateProps {
  icon?: string
  title: string
  description?: string
  actionLabel?: string
  onAction?: () => void
  className?: string
  children?: ReactNode
}

export interface DocumentUploadProps {
  files?: File[]
  onChange?: (files: File[]) => void
  accept?: string
  multiple?: boolean
  maxSizeMb?: number
  hint?: string
  title?: string
  className?: string
  disabled?: boolean
}

export interface EntityOption {
  id: string | number
  label: string
  sublabel?: string
}

export interface EntitySearchProps {
  label?: string
  placeholder?: string
  options: EntityOption[]
  value?: EntityOption | null
  onChange?: (value: EntityOption | null) => void
  multi?: boolean
  values?: EntityOption[]
  onChangeMulti?: (values: EntityOption[]) => void
  disabled?: boolean
  className?: string
  emptyMessage?: string
}

export interface UploadButtonProps {
  onFiles?: (files: File[]) => void
  accept?: string
  multiple?: boolean
  maxSizeMb?: number
  variant?: ButtonVariant
  size?: ButtonSize
  label?: string
  className?: string
  disabled?: boolean
  iconOnly?: boolean
}

export interface BackButtonProps {
  to?: string
  from?: string
  label?: string
  className?: string
}

export interface BulkSelectionBarProps {
  selectedCount: number
  filteredCount: number
  onCancel: () => void
  children?: ReactNode
}

export interface HeaderProps {
  title?: string
  className?: string
  style?: CSSProperties
}

export interface HeaderBreakChipProps {
  active?: boolean
}

export const DEFAULT_RAIL_ITEMS: RailItem[] = [
  { id: 'dashboard', icon: 'dashboard', label: 'Dashboard', to: '/dashboard', visible: true },
  { id: 'my-work', icon: 'person', label: 'My Work', to: '/my-work', visible: true },
  { id: 'sales', icon: 'trending_up', label: 'Sales', to: '/sales', visible: true },
  { id: 'projects', icon: 'folder_managed', label: 'Projects', to: '/projects', visible: true },
  { id: 'workforce', icon: 'groups', label: 'Workforce', to: '/workforce', visible: true },
  { id: 'payroll', icon: 'payments', label: 'Payroll', to: '/payroll', visible: true },
  { id: 'approvals', icon: 'fact_check', label: 'Approvals', to: '/approvals', visible: true },
  { id: 'admin', icon: 'admin_panel_settings', label: 'Administration', to: '/admin', visible: true },
]

export interface IconRailProps {
  isExpanded: boolean
  onToggleExpand: () => void
  items?: RailItem[]
  onLogout?: () => void
}

export interface ListToolbarProps {
  searchValue?: string
  search?: string
  onSearchChange: (value: string) => void
  searchPlaceholder?: string
  filterSlot?: ReactNode
  actionsSlot?: ReactNode
  /** Alias for actionsSlot */
  actions?: ReactNode
  children?: ReactNode
  filtersActive?: boolean
  onResetFilters?: () => void | Promise<void>
  onRefresh?: () => void | Promise<void>
  className?: string
}

export interface PageHeaderProps {
  title: string
  description?: string
  breadcrumbs?: ReactNode
  actions?: ReactNode
  showBack?: boolean
  backTo?: string
  backLabel?: string
  className?: string
}

export interface QuickOverviewAction {
  id: string
  label: string
  icon?: string
  onClick: () => void
  danger?: boolean
  variant?: ButtonVariant
}

export type OpenQuickOverviewOptions = {
  title: string
  subtitle?: string
  icon?: string
  status?: string
  statusDotClass?: string
  content: ReactNode
  onOpenFull?: () => void
  fullRecordLabel?: string
  onEdit?: () => void
  editLabel?: string
  secondaryLabel?: string
  onSecondary?: () => void
  actions?: QuickOverviewAction[]
  widthClass?: string
}

export interface QuickOverviewContextValue {
  isOpen: boolean
  openPanel: (options: OpenQuickOverviewOptions) => void
  open: (options: OpenQuickOverviewOptions) => void
  closePanel: () => void
}

export interface NoteItem {
  id: number
  body: string
  author_name: string
  author_initials: string
  created_at: string
  reference_type: NoteReferenceType
  reference_id: number
}

export interface NotesPanelProps {
  title?: string
  className?: string
  initialNotes?: NoteItem[]
  referenceType?: NoteReferenceType
  referenceId?: number
  onAdd?: (body: string) => Promise<NoteItem | void> | NoteItem | void
}

export interface ActivityItem {
  id: string
  title: string
  description?: string
  actor?: string
  timestamp: string
  icon?: string
  badge?: string
}

export interface ActivityFeedProps {
  items: ActivityItem[]
  variant?: 'standard' | 'compact'
  emptyMessage?: string
  emptyHint?: string
  className?: string
  title?: string
  headerAction?: ReactNode
  framed?: boolean
  header?: ReactNode
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  isLoading?: boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  children: ReactNode
}

export interface EditButtonProps {
  onClick?: () => void
  iconOnly?: boolean
  variant?: ButtonVariant
  size?: ButtonSize
  className?: string
  label?: string
  disabled?: boolean
  title?: string
  'aria-label'?: string
}

export interface MetricCardProps {
  label: string
  value: ReactNode
  hint?: string
  icon?: string
  valueClassName?: string
  className?: string
}

export interface KpiCardProps {
  icon: string
  iconClass: string
  label: string
  value: number | string
  trend: string
  trendUp?: boolean
  trendClass?: string
  onClick?: () => void
  className?: string
}

export interface TimelineStepProps {
  title: string
  body: string
  time?: string
  done?: boolean
  active?: boolean
  muted?: boolean
}

export interface PaginationProps {
  page: number
  pageSize?: number
  total: number
  onPageChange: (page: number) => void
  itemLabel?: string
  className?: string
}

export interface ProgressProps {
  value: number
  max?: number
  label?: string
  showValue?: boolean
  className?: string
  'aria-label'?: string
}

export interface RefreshButtonProps {
  onClick?: () => void
  isLoading?: boolean
  variant?: ButtonVariant
  size?: ButtonSize
  className?: string
  label?: string
  iconOnly?: boolean
  disabled?: boolean
  title?: string
}

export interface RowAction {
  id: string
  label: string
  icon?: string
  onClick: () => void
  danger?: boolean
  disabled?: boolean
}

export interface RowActionsProps {
  actions: RowAction[]
  label?: string
}

export interface SaveDraftButtonProps {
  onClick?: () => void
  isLoading?: boolean
  disabled?: boolean
  size?: ButtonSize
  className?: string
  label?: string
}

export interface SearchableOption {
  value: string
  label: string
  meta?: string
  disabled?: boolean
}

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
  group?: string
}

export interface SelectProps {
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  label?: string
  error?: string
  className?: string
  minWidthClass?: string
  id?: string
  disabled?: boolean
  'aria-label'?: string
}

export type SimpleRecordStatus = 'Active' | 'Inactive' | boolean

export interface StatusDotProps {
  status: SimpleRecordStatus
  className?: string
  size?: 'sm' | 'md'
}

import type { Action, ResourceName, ScopeName } from '@/shared/schema'

export interface CanParams {
  action: Action | string
  resource: ResourceName | string
  /** Minimum scope required; ORGANIZATION satisfies all */
  minScope?: ScopeName | string
  employmentId?: number
}
type GrantKey = string // `${resource}|${action}`

export interface EffectiveGrants {
  isSuperAdmin: boolean
  maxScopeByGrant: Map<GrantKey, number>
}

export interface EntitySearchState {
  selected: EntityOption | null
  selectedMultiple: EntityOption[]
}