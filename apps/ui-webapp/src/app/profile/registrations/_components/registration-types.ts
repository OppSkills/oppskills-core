export type RegistrationType = "Event" | "Competition";

export interface RegistrationStage {
  label: string;
  status: "completed" | "current" | "pending";
}

export interface Registration {
  id: string;
  title: string;
  type: RegistrationType;
  opportunityType: "event" | "hackathon";
  slug: string;
  registeredOn: string;
  registeredBy: string;
  teamName: string;
  deadline: string;
  bannerUrl: string;
  stages: RegistrationStage[];
  isComplete: boolean;
}
