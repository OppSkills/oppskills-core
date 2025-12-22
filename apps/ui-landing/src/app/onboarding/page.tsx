"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { useQueryState } from "nuqs";
import { useForm } from "@tanstack/react-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import {
  GenderValue,
  UserCategoryValue,
  ExperienceLevelValue,
  TeamPreferenceValue,
  type CreateOnboardingDto,
} from "@oppskills/types/frontend";

import { submitOnboarding } from "@/lib/api/usersApi";
import { searchColleges } from "@/lib/api/collegesApi";
import {
  Loader2,
  User,
  GraduationCap,
  MapPin,
  Sparkles,
  Trophy,
  Users,
  ChevronLeft,
  ChevronRight,
  Check,
  ArrowRight,
  ChevronsUpDown,
} from "lucide-react";

// Types for form data
interface OnboardingFormData {
  // Step 1
  gender: GenderValue | "";
  userCategory: UserCategoryValue | "";
  // Step 2
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
  // Step 3
  locationCity: string;
  locationState: string;
  locationCountry: string;
  // Step 4
  interests: string[];
  skills: string[];
  // Step 5
  experienceLevel: ExperienceLevelValue | "";
  // Step 6
  teamPreference: TeamPreferenceValue | "";
}

const STEP_NAMES = [
  "Primary Identity",
  "Education/Work Details",
  "Location",
  "Interests & Skills",
  "Experience Level",
  "Team Preference",
];

const STEP_ICONS = [User, GraduationCap, MapPin, Sparkles, Trophy, Users];

const GENDER_OPTIONS = [
  { value: GenderValue.MALE, label: "Male" },
  { value: GenderValue.FEMALE, label: "Female" },
  { value: GenderValue.OTHER, label: "Other" },
  { value: GenderValue.PREFER_NOT_TO_SAY, label: "Prefer not to say" },
];

const USER_CATEGORY_OPTIONS = [
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

const EXPERIENCE_LEVEL_OPTIONS = [
  {
    value: ExperienceLevelValue.BEGINNER,
    label: "Beginner",
    description: "Just starting out",
  },
  {
    value: ExperienceLevelValue.INTERMEDIATE,
    label: "Intermediate",
    description: "Some experience",
  },
  {
    value: ExperienceLevelValue.ADVANCED,
    label: "Advanced",
    description: "Considerable experience",
  },
  {
    value: ExperienceLevelValue.EXPERT,
    label: "Expert",
    description: "Extensive experience",
  },
];

const TEAM_PREFERENCE_OPTIONS = [
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

const INTEREST_SUGGESTIONS = [
  "Web Development",
  "Mobile Development",
  "AI/ML",
  "Data Science",
  "Blockchain",
  "Cloud Computing",
  "Cybersecurity",
  "DevOps",
  "IoT",
  "AR/VR",
  "Game Development",
  "Open Source",
];

const SKILL_SUGGESTIONS = [
  "JavaScript",
  "Python",
  "React",
  "Node.js",
  "TypeScript",
  "Java",
  "C++",
  "Go",
  "Rust",
  "SQL",
  "MongoDB",
  "Docker",
  "Kubernetes",
  "AWS",
  "Firebase",
  "GraphQL",
];

export default function OnboardingPage() {
  const router = useRouter();
  const { getToken } = useAuth();
  const [step, setStep] = useQueryState("step", {
    defaultValue: "1",
    parse: (value) => value || "1",
  });
  const [returnUrl] = useQueryState("returnUrl", {
    defaultValue: "",
    parse: (value) => value || "",
  });
  const currentStep = parseInt(step || "1", 10);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [collegeSearchQuery, setCollegeSearchQuery] = useState("");
  const [collegeSearchResults, setCollegeSearchResults] = useState<
    Array<{ id: string; name: string; city: string; state: string }>
  >([]);
  const [isSearchingColleges, setIsSearchingColleges] = useState(false);
  const [collegeComboboxOpen, setCollegeComboboxOpen] = useState(false);

  const form = useForm({
    defaultValues: {
      gender: "" as GenderValue | "",
      userCategory: "" as UserCategoryValue | "",
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
      locationCity: "",
      locationState: "",
      locationCountry: "India",
      interests: [] as string[],
      skills: [] as string[],
      experienceLevel: "" as ExperienceLevelValue | "",
      teamPreference: "" as TeamPreferenceValue | "",
    },
    onSubmit: async ({ value }) => {
      await handleFinalSubmit(value);
    },
  });

  // LocalStorage key for persisting form data
  const STORAGE_KEY = "oppskills_onboarding_form";
  const hasLoadedFromStorage = useRef(false);
  const previousUserCategory = useRef<UserCategoryValue | "">("");

  // Clear irrelevant fields when userCategory changes to prevent stale data submission
  useEffect(() => {
    const currentCategory = form.state.values.userCategory;
    
    // Skip on initial load or if category hasn't actually changed
    if (!hasLoadedFromStorage.current || previousUserCategory.current === currentCategory) {
      previousUserCategory.current = currentCategory;
      return;
    }

    // Clear fields based on the new category
    switch (currentCategory) {
      case UserCategoryValue.WORKING_PROFESSIONAL:
        // Clear college and school fields - professionals only need company info
        form.setFieldValue("collegeId", "");
        form.setFieldValue("collegeName", "");
        form.setFieldValue("collegeCurrentYear", "");
        form.setFieldValue("collegePassoutYear", "");
        form.setFieldValue("collegeSkipped", false);
        form.setFieldValue("schoolName", "");
        form.setFieldValue("schoolClass", "");
        form.setFieldValue("schoolAddress", "");
        break;

      case UserCategoryValue.FRESHER:
        // Clear school and company fields - freshers may optionally add college
        form.setFieldValue("schoolName", "");
        form.setFieldValue("schoolClass", "");
        form.setFieldValue("schoolAddress", "");
        form.setFieldValue("companyName", "");
        form.setFieldValue("jobTitle", "");
        break;

      case UserCategoryValue.COLLEGE_STUDENT:
      case UserCategoryValue.PROFESSIONAL_SCHOOL_STUDENT:
        // Clear school and company fields - college students only need college info
        form.setFieldValue("schoolName", "");
        form.setFieldValue("schoolClass", "");
        form.setFieldValue("schoolAddress", "");
        form.setFieldValue("companyName", "");
        form.setFieldValue("jobTitle", "");
        break;

      case UserCategoryValue.SCHOOL_STUDENT:
        // Clear college and company fields - school students only need school info
        form.setFieldValue("collegeId", "");
        form.setFieldValue("collegeName", "");
        form.setFieldValue("collegeCurrentYear", "");
        form.setFieldValue("collegePassoutYear", "");
        form.setFieldValue("collegeSkipped", false);
        form.setFieldValue("companyName", "");
        form.setFieldValue("jobTitle", "");
        break;
    }

    previousUserCategory.current = currentCategory;
  }, [form.state.values.userCategory, form]);

  // Load saved form data from localStorage on mount
  useEffect(() => {
    if (hasLoadedFromStorage.current) return;

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<OnboardingFormData>;
        // Restore each field
        if (parsed.gender) form.setFieldValue("gender", parsed.gender);
        if (parsed.userCategory)
          form.setFieldValue("userCategory", parsed.userCategory);
        if (parsed.schoolName)
          form.setFieldValue("schoolName", parsed.schoolName);
        if (parsed.schoolClass)
          form.setFieldValue("schoolClass", parsed.schoolClass);
        if (parsed.schoolAddress)
          form.setFieldValue("schoolAddress", parsed.schoolAddress);
        if (parsed.collegeId) form.setFieldValue("collegeId", parsed.collegeId);
        if (parsed.collegeName)
          form.setFieldValue("collegeName", parsed.collegeName);
        if (parsed.collegeCurrentYear)
          form.setFieldValue("collegeCurrentYear", parsed.collegeCurrentYear);
        if (parsed.collegePassoutYear)
          form.setFieldValue("collegePassoutYear", parsed.collegePassoutYear);
        if (typeof parsed.collegeSkipped === "boolean")
          form.setFieldValue("collegeSkipped", parsed.collegeSkipped);
        if (parsed.companyName)
          form.setFieldValue("companyName", parsed.companyName);
        if (parsed.jobTitle) form.setFieldValue("jobTitle", parsed.jobTitle);
        if (parsed.locationCity)
          form.setFieldValue("locationCity", parsed.locationCity);
        if (parsed.locationState)
          form.setFieldValue("locationState", parsed.locationState);
        if (parsed.locationCountry)
          form.setFieldValue("locationCountry", parsed.locationCountry);
        if (parsed.interests) form.setFieldValue("interests", parsed.interests);
        if (parsed.skills) form.setFieldValue("skills", parsed.skills);
        if (parsed.experienceLevel)
          form.setFieldValue("experienceLevel", parsed.experienceLevel);
        if (parsed.teamPreference)
          form.setFieldValue("teamPreference", parsed.teamPreference);
      }
    } catch (error) {
      console.error("Error loading saved form data:", error);
    }

    hasLoadedFromStorage.current = true;
  }, [form]);

  // Save form data to localStorage whenever values change
  useEffect(() => {
    // Only save after initial load
    if (!hasLoadedFromStorage.current) return;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(form.state.values));
    } catch (error) {
      console.error("Error saving form data:", error);
    }
  }, [form.state.values]);

  // Clear localStorage after successful submission
  const clearSavedFormData = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error("Error clearing saved form data:", error);
    }
  }, []);

  const handleCollegeSearch = useCallback(
    async (query: string) => {
      setCollegeSearchQuery(query);
      if (query.length < 2) {
        setCollegeSearchResults([]);
        return;
      }

      setIsSearchingColleges(true);
      try {
        const token = await getToken();
        if (token) {
          const results = await searchColleges(token, query);
          setCollegeSearchResults(results);
        }
      } catch (error) {
        console.error("Error searching colleges:", error);
      } finally {
        setIsSearchingColleges(false);
      }
    },
    [getToken]
  );

  const handleFinalSubmit = async (data: OnboardingFormData) => {
    setIsSubmitting(true);

    try {
      const token = await getToken();
      if (!token) {
        toast.error("Please sign in to continue");
        router.push("/");
        return;
      }

      const onboardingData: CreateOnboardingDto = {
        gender: data.gender as GenderValue,
        userCategory: data.userCategory as UserCategoryValue,
        schoolName: data.schoolName || undefined,
        schoolClass: data.schoolClass || undefined,
        schoolAddress: data.schoolAddress || undefined,
        collegeId: data.collegeId || undefined,
        collegeCurrentYear: data.collegeCurrentYear || undefined,
        collegePassoutYear: data.collegePassoutYear
          ? parseInt(data.collegePassoutYear, 10)
          : undefined,
        collegeSkipped: data.collegeSkipped,
        companyName: data.companyName || undefined,
        jobTitle: data.jobTitle || undefined,
        locationCity: data.locationCity,
        locationState: data.locationState,
        locationCountry: data.locationCountry,
        interests: data.interests,
        skills: data.skills,
        experienceLevel:
          (data.experienceLevel as ExperienceLevelValue) || undefined,
        teamPreference:
          (data.teamPreference as TeamPreferenceValue) || undefined,
      };

      await submitOnboarding(token, onboardingData);
      clearSavedFormData(); // Clear localStorage on successful submission
      toast.success("Onboarding completed! Welcome to OppSkills!");
      
      // Redirect to returnUrl if provided, otherwise go to dashboard
      const redirectTo = returnUrl && returnUrl.length > 0 ? returnUrl : "/dashboard";
      router.push(redirectTo);
    } catch (error) {
      console.error("Error submitting onboarding:", error);
      toast.error("Failed to complete onboarding. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const validateCurrentStep = (): boolean => {
    const values = form.state.values;

    switch (currentStep) {
      case 1:
        return !!values.gender && !!values.userCategory;
      case 2:
        if (values.userCategory === UserCategoryValue.SCHOOL_STUDENT) {
          return !!values.schoolName && !!values.schoolClass;
        }
        if (
          values.userCategory === UserCategoryValue.COLLEGE_STUDENT ||
          values.userCategory === UserCategoryValue.PROFESSIONAL_SCHOOL_STUDENT
        ) {
          return values.collegeSkipped || !!values.collegeId;
        }
        return true;
      case 3:
        return (
          !!values.locationCity &&
          !!values.locationState &&
          !!values.locationCountry
        );
      case 4:
      case 5:
      case 6:
        return true; // These are optional steps
      default:
        return false;
    }
  };

  const goToNextStep = () => {
    if (validateCurrentStep()) {
      if (currentStep < 6) {
        setStep(String(currentStep + 1));
      } else {
        form.handleSubmit();
      }
    } else {
      toast.error("Please fill in all required fields");
    }
  };

  const goToPreviousStep = () => {
    if (currentStep > 1) {
      setStep(String(currentStep - 1));
    }
  };

  const progress = (currentStep / 6) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-purple-50 flex flex-col">
      {/* Header */}
      <header className="py-6 px-8 border-b border-violet-100">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
              OppSkills
            </span>
          </div>
          <Badge variant="secondary" className="text-sm">
            Step {currentStep} of 6
          </Badge>
        </div>
      </header>

      {/* Progress bar */}
      <div className="px-8 py-4">
        <div className="max-w-4xl mx-auto">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between mt-2">
            {STEP_NAMES.map((name, index) => {
              const Icon = STEP_ICONS[index];
              const isActive = currentStep === index + 1;
              const isCompleted = currentStep > index + 1;
              return (
                <div
                  key={name}
                  className={`flex flex-col items-center ${
                    isActive
                      ? "text-violet-600"
                      : isCompleted
                        ? "text-green-600"
                        : "text-gray-400"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 transition-all ${
                      isActive
                        ? "bg-violet-100 ring-2 ring-violet-600"
                        : isCompleted
                          ? "bg-green-100"
                          : "bg-gray-100"
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Icon className="w-4 h-4" />
                    )}
                  </div>
                  <span className="text-xs font-medium hidden md:block">
                    {name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center p-8">
        <Card className="w-full max-w-2xl shadow-xl border-violet-100">
          <CardHeader className="space-y-1 pb-6">
            <div className="flex items-center gap-3">
              {React.createElement(STEP_ICONS[currentStep - 1], {
                className: "w-6 h-6 text-violet-600",
              })}
              <CardTitle className="text-2xl">
                {STEP_NAMES[currentStep - 1]}
              </CardTitle>
            </div>
            <CardDescription className="text-base">
              {currentStep === 1 &&
                "Tell us about yourself to personalize your experience"}
              {currentStep === 2 && "Share your educational or work background"}
              {currentStep === 3 && "Where are you based?"}
              {currentStep === 4 &&
                "What are you passionate about? What skills do you have?"}
              {currentStep === 5 &&
                "How would you rate your experience level? (Optional)"}
              {currentStep === 6 &&
                "What's your team preference for hackathons? (Optional)"}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Step 1: Primary Identity */}
            {currentStep === 1 && (
              <FieldGroup>
                <form.Field name="gender">
                  {(field) => (
                    <Field>
                      <FieldLabel>Gender *</FieldLabel>
                      <Select
                        value={field.state.value}
                        onValueChange={(value) =>
                          field.handleChange(value as GenderValue)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select your gender" />
                        </SelectTrigger>
                        <SelectContent>
                          {GENDER_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                  )}
                </form.Field>

                <form.Field name="userCategory">
                  {(field) => (
                    <Field>
                      <FieldLabel>I am a... *</FieldLabel>
                      <Select
                        value={field.state.value}
                        onValueChange={(value) =>
                          field.handleChange(value as UserCategoryValue)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select your category" />
                        </SelectTrigger>
                        <SelectContent>
                          {USER_CATEGORY_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                  )}
                </form.Field>
              </FieldGroup>
            )}

            {/* Step 2: Education/Work Details */}
            {currentStep === 2 && (
              <FieldGroup>
                {form.state.values.userCategory ===
                  UserCategoryValue.SCHOOL_STUDENT && (
                  <>
                    <form.Field name="schoolName">
                      {(field) => (
                        <Field>
                          <FieldLabel>School Name *</FieldLabel>
                          <Input
                            value={field.state.value}
                            onChange={(e) => field.handleChange(e.target.value)}
                            placeholder="Enter your school name"
                          />
                        </Field>
                      )}
                    </form.Field>

                    <form.Field name="schoolClass">
                      {(field) => (
                        <Field>
                          <FieldLabel>Class/Grade *</FieldLabel>
                          <Input
                            value={field.state.value}
                            onChange={(e) => field.handleChange(e.target.value)}
                            placeholder="e.g., 10th, 12th"
                          />
                        </Field>
                      )}
                    </form.Field>

                    <form.Field name="schoolAddress">
                      {(field) => (
                        <Field>
                          <FieldLabel>School Address</FieldLabel>
                          <Input
                            value={field.state.value}
                            onChange={(e) => field.handleChange(e.target.value)}
                            placeholder="City, State"
                          />
                        </Field>
                      )}
                    </form.Field>
                  </>
                )}

                {(form.state.values.userCategory ===
                  UserCategoryValue.COLLEGE_STUDENT ||
                  form.state.values.userCategory ===
                    UserCategoryValue.PROFESSIONAL_SCHOOL_STUDENT) && (
                  <>
                    <Field>
                      <FieldLabel>College *</FieldLabel>
                      <Popover
                        open={collegeComboboxOpen}
                        onOpenChange={setCollegeComboboxOpen}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={collegeComboboxOpen}
                            className="w-full justify-between font-normal"
                            disabled={form.state.values.collegeSkipped}
                          >
                            {form.state.values.collegeName ||
                              "Search for your college..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent
                          className="w-full min-w-[400px] p-0"
                          align="start"
                        >
                          <Command shouldFilter={false}>
                            <CommandInput
                              placeholder="Search colleges..."
                              value={collegeSearchQuery}
                              onValueChange={(value) =>
                                handleCollegeSearch(value)
                              }
                            />
                            <CommandList>
                              {isSearchingColleges && (
                                <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  Searching...
                                </div>
                              )}
                              {!isSearchingColleges &&
                                collegeSearchQuery.length >= 2 &&
                                collegeSearchResults.length === 0 && (
                                  <CommandEmpty>
                                    No colleges found.
                                  </CommandEmpty>
                                )}
                              {collegeSearchQuery.length < 2 &&
                                !form.state.values.collegeName && (
                                  <div className="px-3 py-2 text-sm text-muted-foreground">
                                    Type at least 2 characters to search...
                                  </div>
                                )}
                              <CommandGroup>
                                {collegeSearchResults.map((college) => (
                                  <CommandItem
                                    key={college.id}
                                    value={college.id}
                                    onSelect={() => {
                                      form.setFieldValue(
                                        "collegeId",
                                        college.id
                                      );
                                      form.setFieldValue(
                                        "collegeName",
                                        college.name
                                      );
                                      setCollegeSearchQuery("");
                                      setCollegeSearchResults([]);
                                      setCollegeComboboxOpen(false);
                                    }}
                                    className="cursor-pointer"
                                  >
                                    <Check
                                      className={`mr-2 h-4 w-4 ${
                                        form.state.values.collegeId ===
                                        college.id
                                          ? "opacity-100"
                                          : "opacity-0"
                                      }`}
                                    />
                                    <div className="flex flex-col">
                                      <span className="font-medium">
                                        {college.name}
                                      </span>
                                      <span className="text-xs text-muted-foreground">
                                        {college.city}, {college.state}
                                      </span>
                                    </div>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <FieldDescription>
                        Search and select your college from the list
                      </FieldDescription>
                    </Field>

                    <form.Field name="collegeSkipped">
                      {(field) => (
                        <Field orientation="horizontal">
                          <Checkbox
                            id="collegeSkipped"
                            checked={field.state.value}
                            onCheckedChange={(checked) =>
                              field.handleChange(checked === true)
                            }
                          />
                          <FieldLabel htmlFor="collegeSkipped">
                            My college is not listed
                          </FieldLabel>
                        </Field>
                      )}
                    </form.Field>

                    <div className="grid grid-cols-2 gap-4">
                      <form.Field name="collegeCurrentYear">
                        {(field) => (
                          <Field>
                            <FieldLabel>Current Year</FieldLabel>
                            <Select
                              value={field.state.value}
                              onValueChange={(value) =>
                                field.handleChange(value)
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Year" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="1st">1st Year</SelectItem>
                                <SelectItem value="2nd">2nd Year</SelectItem>
                                <SelectItem value="3rd">3rd Year</SelectItem>
                                <SelectItem value="4th">4th Year</SelectItem>
                                <SelectItem value="5th">5th Year</SelectItem>
                                <SelectItem value="graduated">
                                  Graduated
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </Field>
                        )}
                      </form.Field>

                      <form.Field name="collegePassoutYear">
                        {(field) => (
                          <Field>
                            <FieldLabel>Passout Year</FieldLabel>
                            <Input
                              type="number"
                              value={field.state.value}
                              onChange={(e) =>
                                field.handleChange(e.target.value)
                              }
                              placeholder="2025"
                              min="2000"
                              max="2035"
                            />
                          </Field>
                        )}
                      </form.Field>
                    </div>
                  </>
                )}

                {form.state.values.userCategory ===
                  UserCategoryValue.WORKING_PROFESSIONAL && (
                  <>
                    <form.Field name="companyName">
                      {(field) => (
                        <Field>
                          <FieldLabel>Company Name</FieldLabel>
                          <Input
                            value={field.state.value}
                            onChange={(e) => field.handleChange(e.target.value)}
                            placeholder="Where do you work?"
                          />
                        </Field>
                      )}
                    </form.Field>

                    <form.Field name="jobTitle">
                      {(field) => (
                        <Field>
                          <FieldLabel>Job Title</FieldLabel>
                          <Input
                            value={field.state.value}
                            onChange={(e) => field.handleChange(e.target.value)}
                            placeholder="e.g., Software Engineer"
                          />
                        </Field>
                      )}
                    </form.Field>
                  </>
                )}

                {form.state.values.userCategory ===
                  UserCategoryValue.FRESHER && (
                  <div className="p-4 bg-violet-50 rounded-lg border border-violet-100">
                    <p className="text-sm text-violet-700">
                      As a fresher, you've recently graduated and are starting
                      your professional journey. You can add your previous
                      college details in the next sections if you'd like.
                    </p>
                  </div>
                )}
              </FieldGroup>
            )}

            {/* Step 3: Location */}
            {currentStep === 3 && (
              <FieldGroup>
                <form.Field name="locationCity">
                  {(field) => (
                    <Field>
                      <FieldLabel>City *</FieldLabel>
                      <Input
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="Enter your city"
                      />
                    </Field>
                  )}
                </form.Field>

                <form.Field name="locationState">
                  {(field) => (
                    <Field>
                      <FieldLabel>State *</FieldLabel>
                      <Input
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="Enter your state"
                      />
                    </Field>
                  )}
                </form.Field>

                <form.Field name="locationCountry">
                  {(field) => (
                    <Field>
                      <FieldLabel>Country *</FieldLabel>
                      <Input
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="Enter your country"
                      />
                    </Field>
                  )}
                </form.Field>
              </FieldGroup>
            )}

            {/* Step 4: Interests & Skills */}
            {currentStep === 4 && (
              <FieldGroup>
                <form.Field name="interests">
                  {(field) => (
                    <Field>
                      <FieldLabel>Interests</FieldLabel>
                      <FieldDescription>
                        Select or add areas you're interested in
                      </FieldDescription>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {INTEREST_SUGGESTIONS.map((interest) => {
                          const isSelected =
                            field.state.value.includes(interest);
                          return (
                            <Badge
                              key={interest}
                              variant={isSelected ? "default" : "outline"}
                              className={`cursor-pointer transition-all ${
                                isSelected
                                  ? "bg-violet-600 hover:bg-violet-700"
                                  : "hover:bg-violet-50"
                              }`}
                              onClick={() => {
                                if (isSelected) {
                                  field.handleChange(
                                    field.state.value.filter(
                                      (i) => i !== interest
                                    )
                                  );
                                } else {
                                  field.handleChange([
                                    ...field.state.value,
                                    interest,
                                  ]);
                                }
                              }}
                            >
                              {interest}
                            </Badge>
                          );
                        })}
                      </div>
                    </Field>
                  )}
                </form.Field>

                <form.Field name="skills">
                  {(field) => (
                    <Field>
                      <FieldLabel>Skills</FieldLabel>
                      <FieldDescription>
                        Select technologies and skills you know
                      </FieldDescription>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {SKILL_SUGGESTIONS.map((skill) => {
                          const isSelected = field.state.value.includes(skill);
                          return (
                            <Badge
                              key={skill}
                              variant={isSelected ? "default" : "outline"}
                              className={`cursor-pointer transition-all ${
                                isSelected
                                  ? "bg-purple-600 hover:bg-purple-700"
                                  : "hover:bg-purple-50"
                              }`}
                              onClick={() => {
                                if (isSelected) {
                                  field.handleChange(
                                    field.state.value.filter((s) => s !== skill)
                                  );
                                } else {
                                  field.handleChange([
                                    ...field.state.value,
                                    skill,
                                  ]);
                                }
                              }}
                            >
                              {skill}
                            </Badge>
                          );
                        })}
                      </div>
                    </Field>
                  )}
                </form.Field>
              </FieldGroup>
            )}

            {/* Step 5: Experience Level */}
            {currentStep === 5 && (
              <FieldGroup>
                <form.Field name="experienceLevel">
                  {(field) => (
                    <Field>
                      <FieldLabel>Experience Level (Optional)</FieldLabel>
                      <div className="grid grid-cols-2 gap-3 mt-2">
                        {EXPERIENCE_LEVEL_OPTIONS.map((option) => {
                          const isSelected = field.state.value === option.value;
                          return (
                            <button
                              key={option.value}
                              type="button"
                              className={`p-4 rounded-xl border-2 text-left transition-all ${
                                isSelected
                                  ? "border-violet-600 bg-violet-50"
                                  : "border-gray-200 hover:border-violet-200"
                              }`}
                              onClick={() => field.handleChange(option.value)}
                            >
                              <div className="font-medium">{option.label}</div>
                              <div className="text-sm text-muted-foreground">
                                {option.description}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </Field>
                  )}
                </form.Field>
              </FieldGroup>
            )}

            {/* Step 6: Team Preference */}
            {currentStep === 6 && (
              <FieldGroup>
                <form.Field name="teamPreference">
                  {(field) => (
                    <Field>
                      <FieldLabel>Team Preference (Optional)</FieldLabel>
                      <div className="grid grid-cols-2 gap-3 mt-2">
                        {TEAM_PREFERENCE_OPTIONS.map((option) => {
                          const isSelected = field.state.value === option.value;
                          return (
                            <button
                              key={option.value}
                              type="button"
                              className={`p-4 rounded-xl border-2 text-left transition-all ${
                                isSelected
                                  ? "border-purple-600 bg-purple-50"
                                  : "border-gray-200 hover:border-purple-200"
                              }`}
                              onClick={() => field.handleChange(option.value)}
                            >
                              <div className="font-medium">{option.label}</div>
                              <div className="text-sm text-muted-foreground">
                                {option.description}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </Field>
                  )}
                </form.Field>
              </FieldGroup>
            )}

            {/* Navigation buttons */}
            <div className="flex justify-between pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={goToPreviousStep}
                disabled={currentStep === 1}
                className="gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>

              <div className="flex gap-3">
                {currentStep >= 4 && currentStep < 6 && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setStep("6")}
                    className="text-muted-foreground"
                  >
                    Skip
                  </Button>
                )}

                <Button
                  type="button"
                  onClick={goToNextStep}
                  disabled={isSubmitting}
                  className="gap-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : currentStep === 6 ? (
                    <>
                      Complete Setup
                      <Check className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
