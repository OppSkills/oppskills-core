export const COMMUNITY_INDUSTRY_VALUES = [
  "TECHNOLOGY",
  "EDUCATION",
  "HEALTHCARE",
  "FINANCE",
  "ARTS_CULTURE",
  "SPORTS_FITNESS",
  "FOOD_BEVERAGE",
  "TRAVEL",
  "NONPROFIT",
  "GOVERNMENT",
  "RETAIL",
  "MEDIA_ENTERTAINMENT",
  "REAL_ESTATE",
  "OTHER",
] as const;

export type CommunityIndustryValue = (typeof COMMUNITY_INDUSTRY_VALUES)[number];

export enum CommunityIndustry {
  TECHNOLOGY = "TECHNOLOGY",
  EDUCATION = "EDUCATION",
  HEALTHCARE = "HEALTHCARE",
  FINANCE = "FINANCE",
  ARTS_CULTURE = "ARTS_CULTURE",
  SPORTS_FITNESS = "SPORTS_FITNESS",
  FOOD_BEVERAGE = "FOOD_BEVERAGE",
  TRAVEL = "TRAVEL",
  NONPROFIT = "NONPROFIT",
  GOVERNMENT = "GOVERNMENT",
  RETAIL = "RETAIL",
  MEDIA_ENTERTAINMENT = "MEDIA_ENTERTAINMENT",
  REAL_ESTATE = "REAL_ESTATE",
  OTHER = "OTHER",
}

export const COMMUNITY_INDUSTRY_LABELS: Record<CommunityIndustryValue, string> =
  {
    TECHNOLOGY: "Technology",
    EDUCATION: "Education",
    HEALTHCARE: "Healthcare",
    FINANCE: "Finance",
    ARTS_CULTURE: "Arts & Culture",
    SPORTS_FITNESS: "Sports & Fitness",
    FOOD_BEVERAGE: "Food & Beverage",
    TRAVEL: "Travel",
    NONPROFIT: "Nonprofit",
    GOVERNMENT: "Government",
    RETAIL: "Retail",
    MEDIA_ENTERTAINMENT: "Media & Entertainment",
    REAL_ESTATE: "Real Estate",
    OTHER: "Other",
  };
