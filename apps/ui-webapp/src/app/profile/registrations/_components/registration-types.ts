export type RegistrationType = "Event" | "Competition";

export interface RegistrationStage {
  label: string;
  status: "completed" | "current" | "pending";
}

export interface Registration {
  id: string;
  title: string;
  type: RegistrationType;
  registeredOn: string;
  registeredBy: string;
  teamName: string;
  deadline: string;
  bannerUrl: string;
  stages: RegistrationStage[];
  isComplete: boolean;
}

export const MOCK_REGISTRATIONS: Registration[] = [
  {
    id: "1",
    title: "All About Ai(A++)",
    type: "Event",
    registeredOn: "01 March 2026",
    registeredBy: "You (rohanvats12@gmail.com)",
    teamName: "Team Titanic",
    deadline: "12 March 2026",
    bannerUrl: "https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=800&auto=format&fit=crop",
    isComplete: false,
    stages: [
      { label: "Registration", status: "completed" },
      { label: "Team", status: "completed" },
      { label: "Payment", status: "current" },
      { label: "Extended Form", status: "pending" },
    ],
  },
  {
    id: "2",
    title: "Film Fiesta 2026",
    type: "Event",
    registeredOn: "10 February 2026",
    registeredBy: "Sejal (sejalmishra@gmail.com)",
    teamName: "Team Orange Fires",
    deadline: "12 February 2026",
    bannerUrl: "https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=800&auto=format&fit=crop",
    isComplete: true,
    stages: [
      { label: "Registration", status: "completed" },
      { label: "Team", status: "completed" },
      { label: "Payment", status: "completed" },
      { label: "Extended Form", status: "completed" },
    ],
  },
  {
    id: "3",
    title: "Hackathon Name",
    type: "Competition",
    registeredOn: "20 December 2025",
    registeredBy: "You (ownemail@gmail.com)",
    teamName: "TheTeamName",
    deadline: "20 December 2025",
    bannerUrl: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?q=80&w=800&auto=format&fit=crop",
    isComplete: false,
    stages: [
      { label: "Registration", status: "completed" },
      { label: "Team", status: "completed" },
      { label: "Payment", status: "current" },
      { label: "Extended Form", status: "pending" },
    ],
  },
  {
    id: "4",
    title: "Hackathon Name",
    type: "Competition",
    registeredOn: "20 December 2025",
    registeredBy: "You (ownemail@gmail.com)",
    teamName: "TheTeamName",
    deadline: "20 December 2025",
    bannerUrl: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?q=80&w=800&auto=format&fit=crop",
    isComplete: false,
    stages: [
      { label: "Registration", status: "completed" },
      { label: "Team", status: "completed" },
      { label: "Payment", status: "current" },
      { label: "Extended Form", status: "pending" },
    ],
  },
];
