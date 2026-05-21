export const mockEvents = [
  {
    id: "mock-event-1",
    name: "Tech Summit 2024",
    description:
      "A premier tech conference featuring industry leaders and innovative workshops. Join us for a day of learning, networking, and inspiration.",
    status: "PUBLISHED",
    approvalStatus: "PENDING",
    slug: "tech-summit-2024",
    startDate: "2024-05-15T09:00:00Z",
    endDate: "2024-05-15T18:00:00Z",
    bannerImageUrl:
      "https://images.unsplash.com/photo-1540575861501-7cf05a4b125a?q=80&w=2070&auto=format&fit=crop",
    locationType: "PHYSICAL",
    locationAddress: "123 Tech Park, Innovation Way",
    locationCity: "San Francisco",
    isFree: false,
    entryFeeAmount: 50.0,
    currency: "USD",
    maxUsers: 500,
    registrationCount: 120,
    organizationName: "Tech Innovations Inc.",
    contactEmail: "contact@techsummit.com",
  },
];

export const mockFestivals = [
  {
    id: "mock-festival-1",
    name: "Winter Arts Festival",
    description:
      "Celebrating local artists and cultural performances in the heart of the city. Enjoy music, art, and food from around the world.",
    status: "PUBLISHED",
    approvalStatus: "PENDING",
    slug: "winter-arts-festival",
    startDate: "2024-12-10T10:00:00Z",
    endDate: "2024-12-12T22:00:00Z",
    posterImageUrl:
      "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?q=80&w=2070&auto=format&fit=crop",
    locationType: "PHYSICAL",
    locationAddress: "Central Plaza, Arts District",
    locationCity: "New York",
    organizationName: "City Arts Council",
    websiteUrl: "https://winterarts.com",
  },
];

export const mockHackathons = [
  {
    id: "mock-hackathon-1",
    name: "Global AI Hack 2024",
    description:
      "Build the future of AI in this 48-hour global hackathon competition. Collaborate with experts and compete for amazing prizes.",
    status: "PUBLISHED",
    approvalStatus: "PENDING",
    slug: "global-ai-hack-2024",
    startDate: "2024-06-20T00:00:00Z",
    endDate: "2024-06-22T00:00:00Z",
    bannerImageUrl:
      "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?q=80&w=2070&auto=format&fit=crop",
    locationType: "VIRTUAL",
    locationVirtualLink: "https://hack.globalai.org",
    isFree: true,
    hackathonType: "CODING_HACKATHON",
    participantType: "TEAM_OF_4",
    maxTeams: 100,
    organizationName: "AI Research Lab",
    contactEmail: "hack@globalai.org",
  },
];

export const getMockData = (type: string, id: string) => {
  switch (type) {
    case "event":
      return mockEvents.find((e) => e.id === id) || mockEvents[0];
    case "festival":
      return mockFestivals.find((f) => f.id === id) || mockFestivals[0];
    case "hackathon":
      return mockHackathons.find((h) => h.id === id) || mockHackathons[0];
    default:
      return null;
  }
};
