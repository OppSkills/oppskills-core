import HeroSection from "@/components/landingpage/hero-section";
import OppskillsFlow from "@/components/landingpage/OppskillsFlow";
import PromoPoster from "@/components/landingpage/PromoPoster";
import UpcomingCompetitions from "@/components/landingpage/UpcomingCompetitions";
import { UpcomingEvents } from "@/components/landingpage/UpcomingEvents";
import UpcomingFestivals from "@/components/landingpage/UpcomingFestivals";
import PastEvents from "@/components/landingpage/PastEvents";
import UpcomingFeatures from "@/components/landingpage/UpcomingFeatures";
import TrustedBy from "@/components/landingpage/_components/TrustedBy";
import WhyChoose from "@/components/landingpage/WhyChoose";

const Home = () => {
  return (
    <>
      <div className="px-4 sm:px-8 md:px-12 xl:px-25 bg-neutral-100">
        <HeroSection />
        <UpcomingCompetitions />
        <UpcomingEvents />
        <UpcomingFestivals />
        <PastEvents />
        {/* <ActiveCommunitypage /> */}
        <OppskillsFlow />
        <WhyChoose />
        <TrustedBy />
        <UpcomingFeatures />
      </div>
      <div className="sm:px-6 lg:px-8 sm:pt-12 xl:px-25">

        <PromoPoster />
      </div>
    </>
  );
};

export default Home;
