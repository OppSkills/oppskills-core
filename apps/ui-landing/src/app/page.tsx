import ActiveCommunitypage from '@/components/landingpage/ActiveCommunitypage'
import HeroSection from '@/components/landingpage/hero-section'
import ParticipateSection from '@/components/landingpage/ParticipateSection'
import UpcomingCompetitions from '@/components/landingpage/UpcomingCompetitions'
import { UpcomingEvents } from '@/components/landingpage/UpcomingEvents'
import React from 'react'

const Home = () => {
  return (
    <div className='poppins'>
      <HeroSection />
      <ParticipateSection />
      <UpcomingCompetitions />
      <UpcomingEvents />
      <ActiveCommunitypage />
    </div>
  )
}

export default Home