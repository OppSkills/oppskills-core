import type { DeliveryStatus, DomainKey } from '../constants/semantic';

export type DeliveryPhase =
  | 'phase-0'
  | 'phase-1'
  | 'phase-2'
  | 'phase-3'
  | 'phase-4'
  | 'phase-5'
  | 'phase-6'
  | 'phase-7'
  | 'phase-8'
  | 'phase-9'
  | 'phase-10'
  | 'phase-11'
  | 'phase-12'
  | 'phase-13'
  | 'phase-14';

export interface ScreenStatusItem {
  readonly id: string;
  readonly name: string;
  readonly domain: DomainKey;
  readonly phase: DeliveryPhase;
  readonly status: DeliveryStatus;
}