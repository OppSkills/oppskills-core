import type { DeliveryStatus, DomainKey } from '../constants/semantic';

export type DeliveryPhase = 'phase-0' | 'phase-1' | 'phase-2' | 'phase-3';

export interface ScreenStatusItem {
  readonly id: string;
  readonly name: string;
  readonly domain: DomainKey;
  readonly phase: DeliveryPhase;
  readonly status: DeliveryStatus;
}