import FlowCard from "./_components/FlowCard";

export default function OppskillsFlow() {
  return (
    <div className="flex flex-col gap-4 pb-20">
      <h2 className="text-4xl text-neutral-900 font-semibold">
        How oppSkills Works
      </h2>
      <p className="text-lg text-neutral-600 pb-4">
        Oh, this platform is going somewhere
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            title: "Find What Fits You",
            description:
              "Personalized discovery across competitions, events, and communities.",
            image: "search.svg",
            step: 1,
          },
          {
            title: "Take Part Instantly",
            description: "Simple & fast registration and easy participation.",
            image: "light.svg",
            step: 2,
          },
          {
            title: "Collaborate & Learn",
            description:
              "Work with like-minded people and learn through real experiences.",
            image: "chat.svg",
            step: 3,
          },
          {
            title: "Level Up Your Journey",
            description:
              "Turn participation into skills, visibility, and opportunities.",
            image: "trophy.svg",
            step: 4,
          },
        ].map((item, index) => (
          <FlowCard
            key={index}
            title={item.title}
            description={item.description}
            image={item.image}
            step={item.step}
          />
        ))}
      </div>
    </div>
  );
}
