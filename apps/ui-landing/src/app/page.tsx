import HeroSection from "@/components/landingpage/hero-section";
import OppskillsFlow from "@/components/landingpage/OppskillsFlow";
import PromoPoster from "@/components/landingpage/PromoPoster";
import UpcomingCompetitions from "@/components/landingpage/UpcomingCompetitions";
import { UpcomingEvents } from "@/components/landingpage/UpcomingEvents";
import PastEvents from "@/components/landingpage/PastEvents";
import UpcomingFeatures from "@/components/landingpage/UpcomingFeatures";

const Home = () => {
  return (
    <>
      <div className="px-8 xl:px-25">
        <HeroSection />
        <UpcomingEvents />
        <UpcomingCompetitions />
        <PastEvents />
        {/* <ActiveCommunitypage /> */}
        <OppskillsFlow />
        <UpcomingFeatures />
      </div>
      <div className="sm:px-6 lg:px-8 sm:pt-12 xl:px-25">

        <PromoPoster />
      </div>
    </>
  );
};

export default Home;
