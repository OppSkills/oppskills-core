import { ApiEventDetailRepository } from './ApiEventDetailRepository';
import type { EventDetailRepository } from '../../domain/repositories/EventDetailRepository';

export const eventDetailRepository: EventDetailRepository = new ApiEventDetailRepository();
