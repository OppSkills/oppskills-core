export interface MockLatencyOptions {
  readonly enabled?: boolean;
  readonly minMs?: number;
  readonly maxMs?: number;
}

const DEFAULT_MIN_MS = 180;
const DEFAULT_MAX_MS = 420;

let mockLatencyEnabled = true;

export function setMockLatencyEnabled(enabled: boolean): void {
  mockLatencyEnabled = enabled;
}

export function getMockLatencyEnabled(): boolean {
  return mockLatencyEnabled;
}

function randomBetween(minMs: number, maxMs: number): number {
  if (maxMs <= minMs) {
    return minMs;
  }

  const span = maxMs - minMs;
  return minMs + Math.floor(Math.random() * (span + 1));
}

export async function withMockLatency<T>(
  value: T,
  options: MockLatencyOptions = {},
): Promise<T> {
  const enabled = options.enabled ?? mockLatencyEnabled;

  if (!enabled) {
    return value;
  }

  const minMs = options.minMs ?? DEFAULT_MIN_MS;
  const maxMs = options.maxMs ?? DEFAULT_MAX_MS;
  const delayMs = randomBetween(minMs, maxMs);

  await new Promise<void>((resolve) => {
    setTimeout(resolve, delayMs);
  });

  return value;
}
