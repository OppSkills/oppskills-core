import type { DiscoverFeedRepository } from '../../domain/repositories/DiscoverFeedRepository';
import { ApiDiscoverFeedRepository } from './ApiDiscoverFeedRepository';

export const discoverFeedRepository: DiscoverFeedRepository = new ApiDiscoverFeedRepository();
