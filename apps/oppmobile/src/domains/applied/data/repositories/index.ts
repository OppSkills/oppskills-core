import type { AppliedFeedRepository } from '../../domain/repositories/AppliedFeedRepository';
import { MockAppliedFeedRepository } from './MockAppliedFeedRepository';

export const appliedFeedRepository: AppliedFeedRepository = new MockAppliedFeedRepository();
