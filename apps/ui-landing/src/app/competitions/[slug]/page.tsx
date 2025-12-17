"use client";
import { CompetitionSidebar } from "./_components/CompetitionSidebar";
import { CompetitionTabs } from "./_components/CompetitionTabs";
import { RoundsTimeline } from "./_components/RoundsTimeline";
import { AboutSection } from "./_components/AboutSection";
import { Organizers } from "./_components/Organizers";
import { Prizes } from "./_components/Prizes";
import { CompetitionDetails } from "./_components/types";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default function CompetitionDetailsPage() {
  const { slug } = useParams();
  const [competition, setCompetition] = useState<CompetitionDetails>({
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
            <p>
            Participants will receive the actual dataset (inspired by Rail India, data.gov.in, etc.) that will be used throughout the competition.
            </p>
            <p>
            The task is to demonstrate structural thinking by answering 6 specific analytical questions regarding trends, visualization choices, and storytelling flow.
            </p>
            <ul>
            <li>Identify top trends in the dataset</li>
            <li>Select appropriate visualization types for specific columns</li>
            <li>Prioritize insights valuable for leadership</li>
            </ul>
            <p>
            The objective is to ensure candidates possess the necessary analytical thinking before moving to the design phase.
            </p>

            <p><b>Round 2: Dashboard Design & Insight Extraction</b></p>
            <p>
            Shortlisted teams will build a single-page dashboard using the full dataset provided in Round 1.
            </p>
            <ul>
            <li>KPI section with high-level metrics</li>
            <li>4–6 core visualizations reflecting time-based or categorical changes</li>
            <li>Interactive elements (if supported by the tool)</li>
            </ul>
            <p>
            Teams must also submit a short PPT summarizing 3–5 key insights derived from their dashboard.
            </p>
            <p>
            The focus is on translating raw data into a clean, well-structured layout that highlights meaningful patterns.
            </p>

            <p><b>Round 3: Presentation and Operational Recommendations (Finale)</b></p>
            <p>
            Finalist teams will present their dashboard and insights via a live video conference (Zoom).
            </p>
            <ul>
            <li>Explain the story behind the dashboard</li>
            <li>Justify design choices and identified trends</li>
            <li>Propose 2–5 practical operational strategies to improve efficiency or service quality</li>
            </ul>
            <p>
            This round tests the ability to go beyond creation and demonstrate strategic thinking.
            </p>

            <p><b>Rules and Guidelines:</b></p>
            <ul>
            <li><b>Dataset Adherence:</b> Teams must strictly use the dataset provided.</li>
            <li><b>Originality:</b> All work must be original. Plagiarism will lead to immediate disqualification.</li>
            <li><b>AI Usage:</b> AI for content generation is prohibited. Coding assistance tools may be used if disclosed.</li>
            <li><b>Tools:</b> Power BI, Tableau, Excel, Python (Plotly/Matplotlib), Google Looker Studio.</li>
            <li><b>Presentation Time:</b> 10–15 minutes + Q&A.</li>
            <li><b>Meeting Etiquette:</b> Ensure clear audio and video quality.</li>
            <li><b>Final Decision:</b> The organizing committee’s decision will be final.</li>
            </ul>

            <p><b>Eligibility & Logistics:</b></p>
            <ul>
            <li><b>Eligibility:</b> Engineering, BBA, BCA, MCA, BSc, BE, B.Com, MBA, M.Tech students</li>
            <li><b>Team Size:</b> 1–3 members per team</li>
            <li><b>Event Format:</b> Rounds 1 & 2 (Online), Round 3 (Live via Zoom)</li>
            </ul>

            <p><b>Judging Criteria:</b></p>
            <ul>
            <li><b>Insight Depth (40%):</b> Meaningful, non-obvious insights grounded in data</li>
            <li><b>Visualization Quality (30%):</b> Correct chart selection and clean layout</li>
            <li><b>Storytelling & Flow (20%):</b> Logical narrative and explanation of impact</li>
            <li><b>Actionability (10%):</b> Practical and relevant recommendations</li>
            </ul>

            <p><b>Round-Specific Submission Details:</b></p>

            <p><b>Round 1:</b></p>
            <ul>
            <li><b>Format:</b> Video responses + supporting document (if applicable)</li>
            <li><b>Task:</b> Answer 6 analytical questions in a recorded video</li>
            <li><b>Evaluation:</b> Dataset understanding (25%), visualization justification (20%), clarity (15%)</li>
            </ul>

            <p><b>Round 2:</b></p>
            <ul>
            <li><b>Format:</b> Dashboard file or public link + short summary PPT</li>
            <li><b>Task:</b> Single-page dashboard with KPIs and 4–6 charts</li>
            <li><b>Evaluation:</b> Structure (25%), visualization (25%), insights (30%)</li>
            </ul>

            <p><b>Round 3:</b></p>
            <ul>
            <li><b>Format:</b> Live presentation with dashboard and PPT</li>
            <li><b>Task:</b> Explain trends, story, and operational recommendations</li>
            <li><b>Evaluation:</b> Strategic thinking, presentation quality, actionability</li>
            </ul>

            <p><b>Important Dates:</b></p>
            <ul>
            <li><b>Registration Deadline:</b> 18th Dec, 11:59 PM</li>
            <li><b>Round 1 Submission:</b> 21st Dec, 11:59 PM</li>
            <li><b>Round 2 Submission:</b> To be announced</li>
            <li><b>Round 3 Finale:</b> To be announced</li>
            </ul>

            <p><b>Additional Information:</b></p>
            <ul>
            <li>Participation is free</li>
            <li>Ensure adherence to deadlines</li>
            <li>If using Python/R, include preprocessing code files</li>
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
      {
        id: "r2",
        name: "Round Name",
        description: "Round Description in 2 lines...",
        startDate: "Feb 1, 2026 12:00 PM IST",
        endDate: "Feb 15, 2026 11:59 PM IST",
        status: "upcoming",
      },
      {
        id: "r3",
        name: "Round Name",
        description: "Round Description in 2 lines...",
        startDate: "Feb 20, 2026 12:00 PM IST",
        endDate: "Feb 25, 2026 11:59 PM IST",
        status: "upcoming",
      },
      {
        id: "r4",
        name: "Round Name",
        description: "Round Description in 2 lines...",
        startDate: "Mar 1, 2026 12:00 PM IST",
        endDate: "Mar 5, 2026 11:59 PM IST",
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
      {
        id: "o2",
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
      {
        id: "p2",
        title: "1st Runner Up",
        amount: "₹ 5,000",
        description: "",
        icon: "medal",
      },
      {
        id: "p3",
        title: "2nd Runner Up",
        amount: "Neckband + Swags",
        description: "",
        icon: "star",
      },
      {
        id: "p4",
        title: "Participation",
        amount: "Certificate",
        description: "",
        icon: "star",
      },
    ],
  });
  console.log(slug);
  const [curTab, setCurTab] = useState<string | null>(null);
  useEffect(() => {
    if (curTab) {
      const element = document.getElementById(curTab);
      if (element) {
        element.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    }
  }, [curTab]);
  return (
    <div className="min-h-screen bg-transparent py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative items-start">
          {/* Sidebar */}
          <div className="lg:col-span-1 lg:sticky lg:top-20">
            <CompetitionSidebar competition={competition} />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            <h1 className="text-3xl font-extrabold text-foreground leading-tight mb-6">
              {competition.title}
            </h1>

            <CompetitionTabs setCurTab={setCurTab} />

            <div className="space-y-12">
              <section id="rounds" className="scroll-mt-24">
                <RoundsTimeline rounds={competition.rounds} />
              </section>

              <section id="details" className="scroll-mt-24">
                <AboutSection content={competition.about} />
              </section>

              <section className="scroll-mt-24">
                {/* Note: In image, this is 'Organizers' visualized after about, 
                      though image labels it 'Rounds Timeline' again erroneously. 
                      I am placing it here to match flow. */}
                <Organizers organizers={competition.organizers} />
              </section>

              <section id="prizes" className="scroll-mt-24">
                <Prizes prizes={competition.prizes} />
              </section>

              <section id="reviews" className="scroll-mt-24">
                <h2 className="text-2xl font-bold text-foreground mb-6">
                  Reviews
                </h2>
                <div className="p-12 text-center text-muted-foreground bg-zinc-50 dark:bg-zinc-900 border border-dashed rounded-xl">
                  Reviews coming soon...
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
