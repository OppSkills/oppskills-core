import Footer from '@/components/footer'
import ActiveCommunitypage from '@/components/landingpage/ActiveCommunitypage'
import HeroSection from '@/components/landingpage/hero-section'
import LandingPage from '@/components/landingpage/landingpage'
import ParticipateSection from '@/components/landingpage/ParticipateSection'
import UpcomingCompetitions from '@/components/landingpage/UpcomingCompetitions'
import { UpcomingEvents } from '@/components/landingpage/UpcomingEvents'
import Navbar from '@/components/navbar'
import React from 'react'

const Home = () => {
  return (
    <div className='poppins'>
      <Navbar/>
      <HeroSection/>
      <ParticipateSection/>
      <UpcomingCompetitions/>
      <UpcomingEvents/>
      <ActiveCommunitypage/>
      {/* <LandingPage/> */}
      {/* <Footer/> */}
    </div>
  )
}

export default Home