/** Shared layout / shell types */

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
  /** If false, item is hidden (permission) */
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
