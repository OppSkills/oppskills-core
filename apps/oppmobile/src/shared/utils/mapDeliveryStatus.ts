import { deliveryStatuses } from '../constants/semantic';
import type { DeliveryStatus } from '../constants/semantic';

const deliveryStatusLabels: Record<DeliveryStatus, string> = {
  [deliveryStatuses.notStarted]: 'Not Started',
  [deliveryStatuses.inProgress]: 'In Progress',
  [deliveryStatuses.readyForReview]: 'Ready For Review',
  [deliveryStatuses.approved]: 'Approved',
};

export function mapDeliveryStatus(status: DeliveryStatus): string {
  return deliveryStatusLabels[status];
}
