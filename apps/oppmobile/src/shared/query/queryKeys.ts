export const queryKeys = {
  delivery: {
    all: ['delivery'] as const,
    screenStatus: ['delivery', 'screen-status'] as const,
    phaseReadiness: (phase: string) => ['delivery', 'phase-readiness', phase] as const,
  },
} as const;
