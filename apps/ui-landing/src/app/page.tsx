import ActiveCommunitypage from "@/components/landingpage/ActiveCommunitypage";
import HeroSection from "@/components/landingpage/hero-section";
import UpcomingCompetitions from "@/components/landingpage/UpcomingCompetitions";
import { UpcomingEvents } from "@/components/landingpage/UpcomingEvents";

const Home = () => {
  return (
    <div className="px-2 sm:px-4 md:px-10 lg:px-20 xl:px-25">
      <HeroSection />
      <UpcomingEvents />
      <UpcomingCompetitions />
      {/* <ActiveCommunitypage /> */}
    </div>
  );
};

export default Home;
