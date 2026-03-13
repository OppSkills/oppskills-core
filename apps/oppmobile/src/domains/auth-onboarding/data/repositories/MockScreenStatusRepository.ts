import { mockScreenStatus } from '../mockScreenStatus';
import type { ScreenStatusEntity } from '../../domain/entities/ScreenStatus';
import type { ScreenStatusRepository } from '../../domain/repositories/ScreenStatusRepository';

export class MockScreenStatusRepository implements ScreenStatusRepository {
  async list(): Promise<ScreenStatusEntity[]> {
    return mockScreenStatus;
  }
}
