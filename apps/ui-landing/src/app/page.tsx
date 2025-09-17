import Footer from '@/components/footer'
import LandingPage from '@/components/landingpage/landingpage'
import Navbar from '@/components/navbar'
import React from 'react'

const Home = () => {
  return (
    <div className='poppins'>
      <Navbar/>
      <LandingPage/>
      <Footer/>
    </div>
  )
}

export default Home