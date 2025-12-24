import Image from "next/image";
import { useState } from "react";
import { Button } from "../ui/button";
import Register from "./_components/Register";
import Login from "./_components/Login";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import { Autoplay } from "swiper/modules";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { useQueryState } from "nuqs";

export default function Auth({ onClose }: { onClose: () => void }) {
  const [authMode, setAuthMode] = useQueryState("auth");
  const [activeIndex, setActiveIndex] = useState(0);
  const currentMode = authMode === "signup" ? "signup" : "login";

  const slides = [
    {
      image: "/characters/competition.png",
      title: "Join Competitions",
      description:
        "Improve your skills by taking part in hackathons, pitch-offs, and quiz challenges.",
      features: ["hackathons", "pitching", "quizzes"],
    },
    {
      image: "/characters/events.png",
      title: "Participate in Events",
      description:
        "Learn, network, and grow through workshops, meets, and campus events.",
      features: ["workshops", "meets", "games"],
    },
    {
      image: "/characters/communities.png",
      title: "Join Communities",
      description:
        "Connect with developers, designers, and entrepreneurs who share your goals.",
      features: ["developers", "designers", "entrepreneurs"],
    },
  ];
  return (
    <div className="fixed top-0 w-full bg-black/80 left-0 h-screen flex justify-center items-center z-50 px-4">
      <div
        className="relative w-full max-w-[850px] min-h-[500px] max-h-[90vh] md:h-[580px] bg-background rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        <div
          className="absolute top-4 right-4 z-50 cursor-pointer p-2 rounded-full bg-background/50 hover:bg-muted transition-colors border border-border/50 backdrop-blur-md"
          onClick={onClose}
        >
          <X className="w-5 h-5 text-foreground" />
        </div>

        {/* Hero Section - Hidden on Mobile */}
        <div className="hidden md:block w-full md:w-[45%] h-full bg-linear-to-br from-primary-500 to-primary/80 relative overflow-hidden">
          <Swiper
            loop={true}
            modules={[Autoplay]}
            autoplay={{
              delay: 3000,
              disableOnInteraction: false,
            }}
            onSlideChange={(swiper) => setActiveIndex(swiper.realIndex)}
            className="h-full"
          >
            {slides.map((slide, index) => (
              <SwiperSlide key={index}>
                <motion.div
                  key={activeIndex === index ? "active" : "inactive"}
                  initial={{ left: -100 }}
                  animate={{ left: 0 }}
                  transition={{ duration: 1 }}
                  className="absolute bottom-0 z-10 left-0 w-full"
                >
                  <Image
                    src={slide.image}
                    alt="Hero"
                    width={400}
                    height={400}
                  />
                </motion.div>

                <div className='z-0 absolute inset-0 bg-[url("/icons/stars_2.svg")] bg-repeat bg-size-[200px_200px] opacity-5 bg-center w-full h-full'></div>
                <div className="p-4">
                  <div className="flex items-center h-full w-full">
                    <motion.div
                      key={activeIndex === index ? "active" : "inactive"}
                      initial={{ opacity: 0, filter: "blur(10px)", top: -100 }}
                      animate={{ opacity: 1, filter: "blur(0px)", top: 0 }}
                      transition={{ duration: 0.5 }}
                      className="w-full max-w-md relative"
                    >
                      <h1 className="py-3 text-4xl font-semibold text-background">
                        {slide.title}
                      </h1>
                      <p className="text-background/90">{slide.description}</p>
                    </motion.div>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>

        {/* Form Section */}
        <div className="w-full md:w-[55%] h-full bg-background flex flex-col">
          <div className="flex-1 overflow-y-auto p-8">
            <div className="max-w-md mx-auto">
              <div>
                <h2 className="text-2xl font-semibold">
                  {currentMode === "login" ? "Sign In" : "Sign Up"}
                </h2>
                <p className="text-foreground/90 py-2">
                  {currentMode === "login"
                    ? "Login to your account"
                    : "Register now to take part in all the events"}
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 py-2 mb-4 w-full">
                <div className="border-2 p-1 rounded-full flex gap-2 w-full">
                  <Button
                    variant={currentMode === "login" ? "default" : "ghost"}
                    className="rounded-full flex-1"
                    onClick={() => setAuthMode("login")}
                  >
                    Sign In
                  </Button>
                  <Button
                    variant={currentMode === "signup" ? "default" : "ghost"}
                    className="rounded-full flex-1"
                    onClick={() => setAuthMode("signup")}
                  >
                    Sign Up
                  </Button>
                </div>
              </div>
              <div className="container">
                {currentMode === "login" ? (
                  <Login setIsOpenLogin={onClose} />
                ) : (
                  <Register setIsOpenLogin={onClose} />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
