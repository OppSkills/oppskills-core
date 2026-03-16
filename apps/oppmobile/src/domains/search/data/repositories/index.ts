import type { SearchRepository } from '../../domain/repositories/SearchRepository';
import { MockSearchRepository } from './MockSearchRepository';

export const searchRepository: SearchRepository = new MockSearchRepository();
