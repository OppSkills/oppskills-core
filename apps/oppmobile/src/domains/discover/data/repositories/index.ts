import type { DiscoverFeedRepository } from '../../domain/repositories/DiscoverFeedRepository';
import { MockDiscoverFeedRepository } from './MockDiscoverFeedRepository';

export const discoverFeedRepository: DiscoverFeedRepository = new MockDiscoverFeedRepository();
