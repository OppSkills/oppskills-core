import type { HackathonDetailRepository } from '../../domain/repositories/HackathonDetailRepository';
import { ApiHackathonDetailRepository } from './ApiHackathonDetailRepository';

export const hackathonDetailRepository: HackathonDetailRepository = new ApiHackathonDetailRepository();
