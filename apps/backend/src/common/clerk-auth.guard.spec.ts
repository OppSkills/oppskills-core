import { ChatStreamTokenService } from './chat-stream-token.service';
import { ClerkAuthGuard } from './clerk-auth.guard';
import { ClerkAuthConfigService } from './config.service';

describe('ClerkAuthGuard', () => {
  it('should be defined', () => {
    const mockConfigService = {} as ClerkAuthConfigService;
    const mockStreamTokens = {} as ChatStreamTokenService;
    expect(new ClerkAuthGuard(mockConfigService, mockStreamTokens)).toBeDefined();
  });
});
