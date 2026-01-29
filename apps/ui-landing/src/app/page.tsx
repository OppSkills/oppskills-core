import HeroSection from "@/components/landingpage/hero-section";
import OppskillsFlow from "@/components/landingpage/OppskillsFlow";
import PromoPoster from "@/components/landingpage/PromoPoster";
import UpcomingCompetitions from "@/components/landingpage/UpcomingCompetitions";
import { UpcomingEvents } from "@/components/landingpage/UpcomingEvents";
import PastEvents from "@/components/landingpage/PastEvents";
import UpcomingFeatures from "@/components/landingpage/UpcomingFeatures";

const Home = () => {
  return (
    <div className="px-2 sm:px-4 md:px-10 lg:px-20 xl:px-25">
      <HeroSection />
      <UpcomingEvents />
      <UpcomingCompetitions />
      <PastEvents />
      {/* <ActiveCommunitypage /> */}
      <OppskillsFlow />
      <UpcomingFeatures />
      <PromoPoster />
    </div>
  );
};

export default Home;
