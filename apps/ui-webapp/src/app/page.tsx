import HeroSection from "@/components/landingpage/hero-section";
import OppskillsFlow from "@/components/landingpage/OppskillsFlow";
import PromoPoster from "@/components/landingpage/PromoPoster";
import UpcomingHackathons from "@/components/landingpage/UpcomingHackathons";
import { UpcomingEvents } from "@/components/landingpage/UpcomingEvents";
import PastEvents from "@/components/landingpage/PastEvents";
import UpcomingFeatures from "@/components/landingpage/UpcomingFeatures";
import TrustedBy from "@/components/landingpage/_components/TrustedBy";
import WhyChoose from "@/components/landingpage/WhyChoose";
import MyOpportunities from "@/components/landingpage/MyOpportunities";

const Home = () => {
  return (
    <>
      <div className="px-4 sm:px-8 md:px-12 xl:px-25 bg-neutral-100">
        <HeroSection />
        <MyOpportunities />
        <UpcomingHackathons />
        <UpcomingEvents />
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
