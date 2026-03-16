import type { HomeFeedRepository } from '../../domain/repositories/HomeFeedRepository';
import { MockHomeFeedRepository } from './MockHomeFeedRepository';

export const homeFeedRepository: HomeFeedRepository = new MockHomeFeedRepository();
