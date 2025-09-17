import React from 'react'
import HeroSection from './hero-section'
import ExploreCommunities from './explore-communities'
import UpcomingEvents from './upcoming-events'
import ExploreHackathons from './explore-hackathons'
import CTA from './cta'
import FeaturesSection from './features-section'
import TestimonialsSection from './testimonials-section'
import HackathonCTA from './hackathon-cta'

const LandingPage = () => {
  return (
    <>
    <HeroSection/>    
    <ExploreCommunities/>
    <UpcomingEvents/>
    <ExploreHackathons/>
    <CTA/>
    <FeaturesSection/>
    <TestimonialsSection/>
    <HackathonCTA/>
    </>
  )
}

export default LandingPage