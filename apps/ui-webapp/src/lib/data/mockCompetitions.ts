export const MOCK_COMPETITIONS_DATA: any = {
  "silicon-valley-funding-summit-2026": {
    id: "1",
    slug: "silicon-valley-funding-summit-2026",
    title:
      "Silicon Valley Funding Summit At CES 2026 - VIP Access For Investors",
    thumbnail:
      "https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=2670&auto=format&fit=crop",
    location: "Las Vegas, NV",
    dateRange: "January 7-10, 2026",
    tags: ["Funding", "Tech", "Innovation"],

    featuredIn: "FestName",
    specificDate: "Monday, 5 January 2026",
    specificTime: "8:00 - 20:00 GMT-8",
    venueName: "College/University Name",
    venueAddress: "City, State",
    teamSize: "1-2 Members",
    impressions: 206,
    registrationDeadline: "8 Days",

    about: `
            <p><b>Theme:</b> Data Visualization Challenge – <i>“Turning Raw Data Into Real Insights”</i></p>

            <p><b>Event Rounds:</b></p>
            
            <p><b>Round 1: Dashboard Thinking & Video Response Assessment</b></p>
            <p>Participants will receive the actual dataset (inspired by Rail India, data.gov.in, etc.) that will be used throughout the competition.</p>
            <p>The task is to demonstrate structural thinking by answering 6 specific analytical questions regarding trends, visualization choices, and storytelling flow.</p>
            <ul>
            <li>Identify top trends in the dataset</li>
            <li>Select appropriate visualization types for specific columns</li>
            <li>Prioritize insights valuable for leadership</li>
            </ul>

            <p><b>Round 2: Dashboard Design & Insight Extraction</b></p>
            <p>Shortlisted teams will build a single-page dashboard using the full dataset provided in Round 1.</p>
            <ul>
            <li>KPI section with high-level metrics</li>
            <li>4–6 core visualizations reflecting time-based or categorical changes</li>
            </ul>
    `,
    rounds: [
      {
        id: "r1",
        name: "Round Name",
        description: "Round Description in 2 lines...",
        startDate: "Jan 10, 2026 12:00 PM IST",
        endDate: "Jan 20, 2026 11:59 PM IST",
        status: "upcoming",
      },
    ],
    organizers: [
      {
        id: "o1",
        name: "Owner Name",
        role: "Organizer",
        avatar: "",
        company: "",
      },
    ],
    prizes: [
      {
        id: "p1",
        title: "Winner",
        amount: "₹ 5,000",
        description: "",
        icon: "trophy",
      },
    ],
  },
};

export async function getCompetitionBySlug(slug: string) {
  // Simulate API fetch
  await new Promise((resolve) => setTimeout(resolve, 50));
  return (
    MOCK_COMPETITIONS_DATA[slug] ||
    MOCK_COMPETITIONS_DATA["silicon-valley-funding-summit-2026"]
  ); // Fallback for demo
}
