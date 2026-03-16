export const queryKeys = {
  delivery: {
    all: ['delivery'] as const,
    screenStatus: ['delivery', 'screen-status'] as const,
    phaseReadiness: (phase: string) => ['delivery', 'phase-readiness', phase] as const,
  },
  home: {
    all: ['home'] as const,
    feed: ['home', 'feed'] as const,
  },
  discover: {
    all: ['discover'] as const,
    feed: ['discover', 'feed'] as const,
  },
  applied: {
    all: ['applied'] as const,
    feed: ['applied', 'feed'] as const,
  },
  competitions: {
    all: ['competitions'] as const,
    detail: ['competitions', 'detail'] as const,
  },
  hackathons: {
    all: ['hackathons'] as const,
    detail: ['hackathons', 'detail'] as const,
  },
} as const;
