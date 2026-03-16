import type { HackathonDetailRepository } from '../../domain/repositories/HackathonDetailRepository';
import { MockHackathonDetailRepository } from './MockHackathonDetailRepository';

export const hackathonDetailRepository: HackathonDetailRepository = new MockHackathonDetailRepository();
