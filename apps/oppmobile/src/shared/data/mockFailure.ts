export type MockFailureKey =
  | 'discover-feed'
  | 'applied-feed'
  | 'competition-detail'
  | 'hackathon-detail';

const mockFailureState: Record<MockFailureKey, boolean> = {
  'discover-feed': false,
  'applied-feed': false,
  'competition-detail': false,
  'hackathon-detail': false,
};

export function setMockFailureEnabled(key: MockFailureKey, enabled: boolean): void {
  mockFailureState[key] = enabled;
}

export function getMockFailureEnabled(key: MockFailureKey): boolean {
  return mockFailureState[key];
}

export async function throwIfMockFailureEnabled(
  key: MockFailureKey,
  createMessage: () => string
): Promise<void> {
  if (!getMockFailureEnabled(key)) {
    return;
  }

  throw new Error(createMessage());
}
