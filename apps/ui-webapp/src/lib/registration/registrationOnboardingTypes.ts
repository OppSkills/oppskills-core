import type {
  GenderValue,
  UserCategoryValue,
  ExperienceLevelValue,
  TeamPreferenceValue,
} from "@oppskills/types/enums";

/** Onboarding form state used inside event/hackathon registration modals. */
export interface RegistrationOnboardingValues {
  gender: GenderValue | "";
  userCategory: UserCategoryValue | "";
  schoolName: string;
  schoolClass: string;
  schoolAddress: string;
  collegeId: string;
  collegeName: string;
  collegeCurrentYear: string;
  collegePassoutYear: string;
  collegeSkipped: boolean;
  companyName: string;
  jobTitle: string;
  locationCoords: string;
  locationState: string;
  locationCountry: string;
  locationPlaceId: string;
  interests: string[];
  skills: string[];
  experienceLevel: ExperienceLevelValue | "";
  teamPreference: TeamPreferenceValue | "";
}

export const EMPTY_REGISTRATION_ONBOARDING: RegistrationOnboardingValues = {
  gender: "",
  userCategory: "",
  schoolName: "",
  schoolClass: "",
  schoolAddress: "",
  collegeId: "",
  collegeName: "",
  collegeCurrentYear: "",
  collegePassoutYear: "",
  collegeSkipped: false,
  companyName: "",
  jobTitle: "",
  locationCoords: "",
  locationState: "",
  locationCountry: "India",
  locationPlaceId: "",
  interests: [],
  skills: [],
  experienceLevel: "",
  teamPreference: "",
};

export type RegistrationOnboardingErrors = Partial<
  Record<keyof RegistrationOnboardingValues | "college", string>
>;
