/**
 * Shared registration field defaults merged with organizer custom fields,
 * keyed by user category (same rules for events and hackathons).
 */

export interface RegistrationField {
  id: string;
  label: string;
  type: string;
  required: boolean;
  order: number;
  options: string[];
  placeholder: string | null;
}

type UserCategory =
  | "SCHOOL_STUDENT"
  | "COLLEGE_STUDENT"
  | "WORKING_PROFESSIONAL"
  | "FRESHER"
  | "PROFESSIONAL_SCHOOL_STUDENT";

/**
 * Default identity + contact fields for registration UIs.
 * For SCHOOL_STUDENT, includes School Class (required by onboarding API).
 */
export function buildDefaultFields(
  userCategory?: string | null,
): RegistrationField[] {
  const fields: RegistrationField[] = [
    {
      id: "default-name",
      label: "Name",
      type: "TEXT",
      required: true,
      order: -50,
      options: [],
      placeholder: "Your full name",
    },
    {
      id: "default-email",
      label: "Email",
      type: "EMAIL",
      required: true,
      order: -40,
      options: [],
      placeholder: "email@example.com",
    },
    {
      id: "default-phone",
      label: "Phone No.",
      type: "PHONE_NO",
      required: true,
      order: -30,
      options: [],
      placeholder: "+91 XXXXX XXXXX",
    },
    {
      id: "default-gender",
      label: "Gender",
      type: "OPTIONS",
      required: true,
      order: -20,
      options: [],
      placeholder: "Select gender",
    },
  ];

  const category = userCategory as UserCategory | undefined;

  if (category === "SCHOOL_STUDENT") {
    fields.push(
      {
        id: "default-school-name",
        label: "School Name",
        type: "TEXT",
        required: true,
        order: -10,
        options: [],
        placeholder: "Your school name",
      },
      {
        id: "default-school-class",
        label: "School Class",
        type: "TEXT",
        required: true,
        order: -9,
        options: [],
        placeholder: "Class / grade",
      },
    );
  } else if (
    category === "COLLEGE_STUDENT" ||
    category === "PROFESSIONAL_SCHOOL_STUDENT" ||
    category === "FRESHER"
  ) {
    fields.push({
      id: "default-college-name",
      label: "College Name",
      type: "TEXT",
      required: true,
      order: -10,
      options: [],
      placeholder: "Your college name",
    });
  } else if (category === "WORKING_PROFESSIONAL") {
    fields.push({
      id: "default-company-name",
      label: "Company Name",
      type: "TEXT",
      required: true,
      order: -10,
      options: [],
      placeholder: "Your company name",
    });
  } else {
    fields.push({
      id: "default-college-name",
      label: "College Name",
      type: "TEXT",
      required: true,
      order: -10,
      options: [],
      placeholder: "Your college/institution name",
    });
  }

  return fields;
}

const IDENTITY_FIELD_LABELS = new Set([
  "school name",
  "school class",
  "college name",
  "company name",
]);

/**
 * Merge category-specific defaults with organizer fields; strip duplicate identity columns.
 */
export function mergeDefaultAndCustomFields(
  customFields: RegistrationField[] | undefined,
  userCategory?: string | null,
): RegistrationField[] {
  const defaults = buildDefaultFields(userCategory);
  const customs = customFields ?? [];

  const defaultLabels = new Set(defaults.map((f) => f.label.toLowerCase()));

  const filteredCustoms = customs.filter(
    (f) =>
      !defaultLabels.has(f.label.toLowerCase()) &&
      !IDENTITY_FIELD_LABELS.has(f.label.toLowerCase()),
  );

  return [...defaults, ...filteredCustoms].sort((a, b) => a.order - b.order);
}
