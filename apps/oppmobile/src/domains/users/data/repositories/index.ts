import type { HomeFeedRepository } from '../../domain/repositories/HomeFeedRepository';
import { ApiHomeFeedRepository } from './ApiHomeFeedRepository';

export const homeFeedRepository: HomeFeedRepository = new ApiHomeFeedRepository();
