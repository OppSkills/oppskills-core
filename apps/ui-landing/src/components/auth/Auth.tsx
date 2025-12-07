import Image from 'next/image'
import { useState } from 'react'
import { Button } from '../ui/button';
import Register from './_components/Register';
import Login from './_components/Login';
import { Swiper, SwiperSlide } from "swiper/react"
import "swiper/css"
import { Autoplay } from "swiper/modules"
import { motion } from "framer-motion"
import { X } from 'lucide-react';

export default function Auth({ setIsOpenLogin }: { setIsOpenLogin: (isOpen: boolean) => void }) {
  const [currentMode, setCurrentMode] = useState("login");
  const [activeIndex, setActiveIndex] = useState(0);
  const slides = [{
    image: "/characters/competition.png",
    title: "Join Competitions",
    description: "Improve your skills by taking part in hackathons, pitch-offs, and quiz challenges.",
    features: ["hackathons", "pitching", "quizzes"]
  }, {
    image: "/characters/events.png",
    title: "Participate in Events",
    description: "Learn, network, and grow through workshops, meets, and campus events.",
    features: ["workshops", "meets", "games"]
  }, {
    image: "/characters/communities.png",
    title: "Join Communities",
    description: "Connect with developers, designers, and entrepreneurs who share your goals.",
    features: ["developers", "designers", "entrepreneurs"]
  }];
  return (
    <div className='h-screen p-6 bg-background fixed top-0 left-0 w-full overflow-y-scroll md:overflow-y-hidden'>
      <div className='fixed top-6 right-6 z-50 cursor-pointer' onClick={() => setIsOpenLogin(false)}><X /></div>
      <div className='flex flex-col-reverse h-full sm:flex-row gap-6 items-center justify-end'>
        <div className='h-full min-h-[600px] sm:min-h-[90vh] md:w-2/5 w-full bg-linear-to-br from-primary to-primary/80 rounded-2xl relative overflow-hidden' >
          <Swiper loop={true} modules={[Autoplay]} autoplay={{
            delay: 3000,
            disableOnInteraction: false,
          }}
            onSlideChange={(swiper) => setActiveIndex(swiper.realIndex)}
            className='h-full'>
            {slides.map((slide, index) => (
              <SwiperSlide key={index}>
                <motion.div key={activeIndex === index ? "active" : "inactive"}
                  initial={{ left: -100 }}
                  animate={{ left: 0 }}
                  transition={{ duration: 1 }}
                  className='absolute bottom-0 z-10 left-0 w-full'>
                  <Image src={slide.image} alt="Hero" width={400} height={400} />
                </motion.div>

                <div className='z-0 absolute inset-0 bg-[url("/icons/stars_2.svg")] bg-repeat bg-size-[200px_200px] opacity-5 bg-center w-full h-full'></div>
                <div className='p-4'>
                  <div className='flex items-center h-full w-full'>
                    <motion.div key={activeIndex === index ? "active" : "inactive"}
                      initial={{ opacity: 0, filter: "blur(10px)", top: -100 }}
                      animate={{ opacity: 1, filter: "blur(0px)", top: 0 }}
                      transition={{ duration: 0.5 }}
                      className='w-full max-w-md relative'>
                      <h1 className='py-3 text-4xl font-semibold text-background'>{slide.title}</h1>
                      <p className='text-background/90'>{slide.description}</p>
                    </motion.div>
                  </div>
                  <div>
                    <motion.div key={activeIndex === index ? "active" : "inactive"}
                      className='xl:absolute z-20 pe-4 pt-4 xl:pt-0 xl:pe-0 h-full top-0 right-20 flex items-center gap-2 justify-between xl:justify-center flex-row xl:flex-col'
                      initial="hidden"
                      animate="show"
                    >
                      {slide.features.map((e: string, i: number) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.2, duration: 0.5, ease: "easeOut" }}
                          className='card hover:bg-background px-2 flex flex-col gap-2 justify-center items-center border-2 rounded-xl xl:h-28 xl:w-28 h-20 w-20 backdrop-blur-2xl text-secondary hover:text-primary'
                        >
                          <Image src={"/icons/" + e + ".svg"} alt={e} width={40} height={40} />
                          <div className='text-xs xl:text-md font-semibold'>{e.charAt(0).toUpperCase() + e.slice(1)}</div>
                        </motion.div>
                      ))}
                    </motion.div>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
        <div className='auth-container flex justify-center h-full md:w-3/5 w-full bg-background'>
          <div className='p-7 lg:w-md'>
            <div>
              <h2 className='text-2xl font-semibold'>{currentMode === "login" ? "Sign In" : "Sign Up"}</h2>
              <p className='text-foreground/90 py-2'>{currentMode === "login" ? "Login to your account" : "Register now to take part in all the events"}</p>
            </div>
            <div className='flex items-center justify-center gap-2 py-2'>
              <div className='border-2 p-1 rounded-full flex gap-2'>
                <Button variant={currentMode === "login" ? "default" : "ghost"} className='rounded-full' onClick={() => setCurrentMode("login")}>Sign In</Button>
                <Button variant={currentMode === "register" ? "default" : "ghost"} className='rounded-full' onClick={() => setCurrentMode("register")}>Sign Up</Button>
              </div>
            </div>
            <div className='container'>
              {currentMode === "login" ? <Login setIsOpenLogin={setIsOpenLogin} /> : <Register setIsOpenLogin={setIsOpenLogin} />}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
