import {
  GenderValue,
  UserCategoryValue,
  TeamPreferenceValue,
} from "@oppskills/types/enums";

export const REGISTRATION_GENDER_OPTIONS = [
  { value: GenderValue.MALE, label: "Male" },
  { value: GenderValue.FEMALE, label: "Female" },
  { value: GenderValue.OTHER, label: "Other" },
  { value: GenderValue.PREFER_NOT_TO_SAY, label: "Prefer not to say" },
];

export const REGISTRATION_USER_CATEGORY_OPTIONS = [
  { value: UserCategoryValue.SCHOOL_STUDENT, label: "School Student" },
  { value: UserCategoryValue.COLLEGE_STUDENT, label: "College Student" },
  {
    value: UserCategoryValue.WORKING_PROFESSIONAL,
    label: "Working Professional",
  },
  { value: UserCategoryValue.FRESHER, label: "Fresher (Recent Graduate)" },
  {
    value: UserCategoryValue.PROFESSIONAL_SCHOOL_STUDENT,
    label: "Professional School Student (MBA, Law, etc.)",
  },
];

export const REGISTRATION_TEAM_PREFERENCE_OPTIONS = [
  {
    value: TeamPreferenceValue.LOOKING_FOR_TEAM,
    label: "Looking for a team",
    description: "I want to join an existing team",
  },
  {
    value: TeamPreferenceValue.HAVE_TEAM,
    label: "I have a team",
    description: "I already have teammates",
  },
  {
    value: TeamPreferenceValue.OPEN_TO_EITHER,
    label: "Open to either",
    description: "Flexible about team arrangements",
  },
  {
    value: TeamPreferenceValue.PREFER_SOLO,
    label: "Prefer solo",
    description: "I prefer working alone",
  },
];

export const REGISTRATION_ONBOARDING_SECTIONS = [
  "Primary Identity",
  "Education/Work Details",
  "Location",
  "Team Preference",
] as const;
