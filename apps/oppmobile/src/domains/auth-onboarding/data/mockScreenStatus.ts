import type { ScreenStatusItem } from '../../../shared/types/app';

export const mockScreenStatus: ScreenStatusItem[] = [
  {
    id: 'intro-screen',
    name: 'Intro Screen',
    domain: 'auth-onboarding',
    phase: 'phase-0',
    status: 'not-started',
  },
  {
    id: 'onboarding-screen-7',
    name: 'Onboarding Screen 7',
    domain: 'auth-onboarding',
    phase: 'phase-0',
    status: 'not-started',
  },
  {
    id: 'onboarding-screen-8',
    name: 'Onboarding Screen 8',
    domain: 'auth-onboarding',
    phase: 'phase-0',
    status: 'not-started',
  },
  {
    id: 'onboarding-screen-9',
    name: 'Onboarding Screen 9',
    domain: 'auth-onboarding',
    phase: 'phase-0',
    status: 'not-started',
  },
  {
    id: 'sign-up',
    name: 'Sign Up',
    domain: 'auth-onboarding',
    phase: 'phase-1',
    status: 'in-progress',
  },
  {
    id: 'sign-in',
    name: 'Sign In',
    domain: 'auth-onboarding',
    phase: 'phase-1',
    status: 'not-started',
  },
  {
    id: 'home-page',
    name: 'Home Page',
    domain: 'users',
    phase: 'phase-1',
    status: 'not-started',
  },
  {
    id: 'discover-page',
    name: 'Discover page',
    domain: 'search',
    phase: 'phase-1',
    status: 'in-progress',
  },
  {
    id: 'applied-page',
    name: 'Applied',
    domain: 'applied',
    phase: 'phase-1',
    status: 'not-started',
  },
];