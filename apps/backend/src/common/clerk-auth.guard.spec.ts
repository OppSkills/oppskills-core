import { ClerkAuthGuard } from './clerk-auth.guard';
import { ClerkAuthConfigService } from './config.service';

describe('ClerkAuthGuard', () => {
  it('should be defined', () => {
    const mockConfigService = {} as ClerkAuthConfigService;
    expect(new ClerkAuthGuard(mockConfigService)).toBeDefined();
  });
});
