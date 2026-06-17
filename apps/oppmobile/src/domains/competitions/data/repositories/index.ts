import type { CompetitionDetailRepository } from '../../domain/repositories/CompetitionDetailRepository';
import { ApiCompetitionDetailRepository } from './ApiCompetitionDetailRepository';

export const competitionDetailRepository: CompetitionDetailRepository =
  new ApiCompetitionDetailRepository();
