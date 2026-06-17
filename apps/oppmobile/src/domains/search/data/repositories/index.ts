import type { SearchRepository } from '../../domain/repositories/SearchRepository';
import { ApiSearchRepository } from './ApiSearchRepository';

export const searchRepository: SearchRepository = new ApiSearchRepository();
