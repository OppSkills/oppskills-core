import type { DeliveryPhase } from '../../../../shared/types/app';
import { deliveryStatuses } from '../../../../shared/constants/semantic';
import type { ScreenStatusRepository } from '../repositories/ScreenStatusRepository';

export interface PhaseReadinessSummary {
  readonly phase: DeliveryPhase;
  readonly totalScreens: number;
  readonly startedScreens: number;
  readonly readyScreens: number;
  readonly approvedScreens: number;
}

export async function getPhaseReadiness(
  repository: ScreenStatusRepository,
  phase: DeliveryPhase,
): Promise<PhaseReadinessSummary> {
  const items = (await repository.list()).filter((item) => item.phase === phase);

  const startedScreens = items.filter((item) => item.status !== deliveryStatuses.notStarted).length;
  const readyScreens = items.filter((item) => item.status === deliveryStatuses.readyForReview).length;
  const approvedScreens = items.filter((item) => item.status === deliveryStatuses.approved).length;

  return {
    phase,
    totalScreens: items.length,
    startedScreens,
    readyScreens,
    approvedScreens,
  };
}
