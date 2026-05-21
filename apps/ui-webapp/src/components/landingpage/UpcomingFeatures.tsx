import UpcomingFeaturesCard from "./_components/UpcomingFeaturesCard";

export default function UpcomingFeatures() {
  return (
    <div className="flex flex-col gap-4 pb-16">
      <h2 className="text-4xl text-neutral-900 font-semibold">
        Upcoming on oppSkills
      </h2>
      <p className="text-lg text-neutral-600 pb-4">
        Oh, this platform is going somewhere
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          {
            title: "Communities Onboarding (PAN India)",
            description:
              "Student clubs, campus groups, and niche communities across India will be able to join OppSkills. Discover events, collaborate with other communities, and grow your impact on a national network.",
            image: "track.svg",
          },
          {
            title: "Skill Acceleration Tracks",
            description:
              "Structured programs designed to help students sharpen practical skills through challenges, mentorship, and real-world projects accelerating the journey from learning to career readiness.",
            image: "mentor.svg",
          },
          {
            title: "College–Industry Bridge",
            description:
              "OppSkills will act as a bridge between colleges and companies, enabling students to access real opportunities while organizations discover emerging talent.",
            image: "challenges.svg",
          },
          {
            title: "Career Launchpads",
            description:
              "A launchpad for students to participate in immersive challenges, gain hands-on experience with real-world problems, and showcase their skills through projects and events—helping them grow their network and become career-ready in practical ways.",
            image: "tools.svg",
          },
        ].map((item, index) => (
          <UpcomingFeaturesCard
            key={index}
            title={item.title}
            description={item.description}
            image={item.image}
          />
        ))}
      </div>
    </div>
  );
}
