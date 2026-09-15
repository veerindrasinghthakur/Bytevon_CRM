import { cn } from '@/shared/lib/cn'
import { deliveryStatusStyles } from '../../schemas/enums'
import type { DeliveryStatus } from '../../types'

export function DeliveryStatusPill({ status }: { status: DeliveryStatus | string }) {
  const styles =
    deliveryStatusStyles[status as DeliveryStatus] ?? deliveryStatusStyles.Pending
  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold', styles.pill)}>
      <span className={cn('w-1.5 h-1.5 rounded-full mr-1.5', styles.dot)} />
      {status}
    </span>
  )
}
