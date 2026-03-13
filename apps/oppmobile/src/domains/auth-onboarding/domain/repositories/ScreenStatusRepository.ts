import type { ScreenStatusEntity } from '../entities/ScreenStatus';

export interface ScreenStatusRepository {
  list(): Promise<ScreenStatusEntity[]>;
}
