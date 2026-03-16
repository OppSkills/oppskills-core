import type { CompetitionDetailRepository } from '../../domain/repositories/CompetitionDetailRepository';
import { MockCompetitionDetailRepository } from './MockCompetitionDetailRepository';

export const competitionDetailRepository: CompetitionDetailRepository =
  new MockCompetitionDetailRepository();
