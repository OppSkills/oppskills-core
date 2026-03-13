import type { DeliveryPhase } from '../../../../shared/types/app';
import type { DeliveryStatus } from '../../../../shared/constants/semantic';
import type { DomainKey } from '../../../../shared/constants/semantic';

export interface ScreenStatusEntity {
  readonly id: string;
  readonly name: string;
  readonly domain: DomainKey;
  readonly phase: DeliveryPhase;
  readonly status: DeliveryStatus;
}
