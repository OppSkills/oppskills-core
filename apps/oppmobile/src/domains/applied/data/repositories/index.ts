import type { AppliedFeedRepository } from '../../domain/repositories/AppliedFeedRepository';
import { ApiAppliedFeedRepository } from './ApiAppliedFeedRepository';

export const appliedFeedRepository: AppliedFeedRepository = new ApiAppliedFeedRepository();
