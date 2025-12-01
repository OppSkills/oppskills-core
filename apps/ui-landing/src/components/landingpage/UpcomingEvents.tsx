import React from "react";
import Image from "next/image";

const eventsData = [
  {
    id: 1,
    imageSrc: "/event-ai-masterclass.png",
    title: "Top 15 AI Skills You Need to Know in 2026",
    date: "Dec 20",
    day: "Every Tue",
    time: "8:00 PM IST",
    tags: ["Online", "Workshop"],
    attendees: "22",
    registerBy: "20 Dec 2024",
    entryFee: "Free",
  },
  {
    id: 2,
    imageSrc: "/event-ai-masterclass.png",
    title: "Masterclass in Conversational AI",
    date: "Dec 22",
    day: "Every Thu",
    time: "6:00 PM IST",
    tags: ["Online", "Live"],
    attendees: "45",
    registerBy: "21 Dec 2024",
    entryFee: "₹ 500",
  },
  {
    id: 3,
    imageSrc: "/event-ai-masterclass.png",
    title: "Design Thinking for GenAI Products",
    date: "Dec 25",
    day: "Sunday",
    time: "10:00 AM IST",
    tags: ["Offline", "Meetup"],
    attendees: "120",
    registerBy: "24 Dec 2024",
    entryFee: "Free",
  },
  {
    id: 4,
    imageSrc: "/event-ai-masterclass.png",
    title: "Top 15 AI Skills You Need to Know in 2026",
    date: "Dec 20",
    day: "Every Tue",
    time: "8:00 PM IST",
    tags: ["Online", "Workshop"],
    attendees: "22",
    registerBy: "20 Dec 2024",
    entryFee: "Free",
  },
  {
    id: 5,
    imageSrc: "/event-ai-masterclass.png",
    title: "Masterclass in Conversational AI",
    date: "Dec 22",
    day: "Every Thu",
    time: "6:00 PM IST",
    tags: ["Online", "Live"],
    attendees: "45",
    registerBy: "21 Dec 2024",
    entryFee: "₹ 500",
  },
  {
    id: 6,
    imageSrc: "/event-ai-masterclass.png",
    title: "Design Thinking for GenAI Products",
    date: "Dec 25",
    day: "Sunday",
    time: "10:00 AM IST",
    tags: ["Offline", "Meetup"],
    attendees: "120",
    registerBy: "24 Dec 2024",
    entryFee: "Free",
  },
];
export const UpcomingEvents = () => {
  return (
    <section className="w-full flex justify-center bg-background">
      <div className="w-full max-w-[1440px] px-6 py-12 md:px-[60px] xl:px-[140px] xl:py-[48px] flex flex-col items-start gap-10">
        <div className="flex flex-col items-start gap-6 w-full">
          <h1 className="poppins font-semibold text-[32px] md:text-[48px] leading-[125%] text-[#100013]">
            Upcoming Events
          </h1>

          <p className="inter font-normal text-[16px] md:text-[20px] leading-[150%] text-[#7C737E] w-full max-w-[1158px]">
            Stay ahead with the latest hackathons, idea challenges, and quizzes.
            Register, participate, and showcase your talent.{" "}
          </p>
        </div>

        <div className="w-full grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 place-items-center xl:place-items-start">
          {eventsData.map((card) => (
            // CARD CONTAINER
            <div
              key={card.id}
              className="flex flex-col w-full max-w-[370px] rounded-[20px] border-[0.5px] border-[#C3BFC4] bg-[#FAFAFA] overflow-hidden shadow-[0_2px_8px_2px_rgba(69,69,69,0.10)] transition-transform hover:scale-[1.02] group cursor-pointer"
            >
              {/* IMAGE SECTION */}
              <div className="relative h-[241px] w-full">
                <Image
                  src={card.imageSrc}
                  alt={card.title}
                  fill
                  className="object-cover"
                />

                {/* Bookmark Icon */}
                <div className="absolute top-4 right-4 w-9 h-9 z-10 mix-blend-color-dodge">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="36"
                    height="36"
                    viewBox="0 0 36 36"
                    fill="none"
                  >
                    <g style={{ mixBlendMode: "color-dodge" }}>
                      <path
                        d="M13.5 7.875C12.8787 7.875 12.375 8.37868 12.375 9C12.375 9.62132 12.8787 10.125 13.5 10.125H22.5C23.1213 10.125 23.625 9.62132 23.625 9C23.625 8.37868 23.1213 7.875 22.5 7.875H13.5Z"
                        fill="#FAFAFA"
                      />
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M17.9138 1.875C14.8049 1.87498 12.3557 1.87496 10.4419 2.13505C8.47682 2.40212 6.90914 2.96203 5.67726 4.20725C4.44704 5.4508 3.89538 7.03053 3.63195 9.01112C3.37496 10.9433 3.37498 13.4169 3.375 16.5616V24.2085C3.37498 26.4698 3.37497 28.2603 3.51901 29.6082C3.66137 30.9403 3.96671 32.1421 4.83876 32.9457C5.53839 33.5905 6.42316 33.997 7.36748 34.105C8.54868 34.2402 9.65158 33.6762 10.738 32.9066C11.8374 32.1278 13.1711 30.9482 14.8538 29.4599L14.9086 29.4114C15.6887 28.7214 16.2168 28.2558 16.6575 27.9336C17.0834 27.6222 17.3434 27.5096 17.5626 27.4655C17.8514 27.4073 18.1486 27.4073 18.4374 27.4655C18.6566 27.5096 18.9166 27.6222 19.3425 27.9336C19.7832 28.2558 20.3113 28.7214 21.0914 29.4114L21.1463 29.4599C22.8289 30.9482 24.1626 32.1278 25.262 32.9066C26.3484 33.6761 27.4513 34.2402 28.6325 34.105C29.5768 33.997 30.4616 33.5905 31.1612 32.9457C32.0333 32.1421 32.3386 30.9403 32.481 29.6082C32.625 28.2603 32.625 26.4699 32.625 24.2086V16.5616C32.625 13.4169 32.625 10.9432 32.3681 9.01112C32.1046 7.03053 31.553 5.4508 30.3227 4.20726C29.0909 2.96203 27.5232 2.40212 25.5581 2.13505C23.6443 1.87496 21.1951 1.87498 18.0862 1.875H17.9138ZM7.2768 5.78965C8.02195 5.03643 9.03377 4.59711 10.7449 4.36456C12.4897 4.12744 14.7859 4.125 18 4.125C21.2141 4.125 23.5103 4.12744 25.2551 4.36456C26.9662 4.59711 27.9781 5.03643 28.7232 5.78965C29.47 6.54455 29.9069 7.57228 30.1377 9.30777C30.3727 11.0744 30.375 13.3983 30.375 16.6463V24.1364C30.375 26.4858 30.3734 28.1553 30.2437 29.3691C30.1108 30.6132 29.8656 31.08 29.6364 31.2912C29.2857 31.6144 28.8447 31.8161 28.3767 31.8696C28.0773 31.9039 27.5753 31.7879 26.5625 31.0705C25.5746 30.3707 24.3317 29.2735 22.5821 27.7261L22.5428 27.6913C21.8119 27.0449 21.2058 26.5087 20.6706 26.1174C20.1111 25.7082 19.5469 25.3937 18.8817 25.2598C18.2997 25.1425 17.7003 25.1425 17.1183 25.2598C16.4531 25.3937 15.8889 25.7082 15.3294 26.1174C14.7942 26.5087 14.1881 27.0448 13.4572 27.6913L13.4179 27.7261C11.6683 29.2736 10.4254 30.3708 9.43748 31.0705C8.42468 31.7879 7.92273 31.9039 7.62327 31.8696C7.15528 31.8161 6.71426 31.6144 6.36356 31.2912C6.13445 31.08 5.88922 30.6132 5.75628 29.3691C5.62656 28.1553 5.625 26.4858 5.625 24.1364V16.6463C5.625 13.3983 5.62734 11.0744 5.86231 9.30777C6.09314 7.57228 6.52999 6.54455 7.2768 5.78965Z"
                        fill="#FAFAFA"
                      />
                    </g>
                  </svg>
                </div>
              </div>

              {/* DESCRIPTION SECTION */}
              <div className="flex flex-col p-4 gap-4 w-full">
                {/* --- TOP ROW: Date/Time + Tags --- */}
                <div className="flex justify-between items-center w-full">
                  {/* Left: Day • Date • Time */}
                  <div className="flex items-center gap-2">
                    {/* Day */}
                    <span className="inter font-normal text-[12px] leading-[150%] text-[#7C737E]">
                      {card.day}
                    </span>

                    {/* Dot Separator */}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="4"
                      height="4"
                      viewBox="0 0 4 4"
                      fill="none"
                    >
                      <circle cx="2" cy="2" r="2" fill="#A099A1" />
                    </svg>

                    {/* Date */}
                    <span className="inter font-normal text-[12px] leading-[150%] text-[#7C737E]">
                      {card.date}
                    </span>

                    {/* Dot Separator */}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="4"
                      height="4"
                      viewBox="0 0 4 4"
                      fill="none"
                    >
                      <circle cx="2" cy="2" r="2" fill="#A099A1" />
                    </svg>

                    {/* Time */}
                    <span className="inter font-normal text-[12px] leading-[150%] text-[#7C737E]">
                      {card.time}
                    </span>
                  </div>

                  {/* Right: Tags */}
                  <div className="flex items-center gap-2">
                    {card.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="flex justify-center items-center px-2 py-1 rounded-[13px] bg-[#EACCF7] text-[#680095] inter font-medium text-[10px] leading-[150%]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* --- MIDDLE: Title --- */}
                <h3 className="poppins font-semibold text-[20px] leading-[125%] text-[#100013] line-clamp-2">
                  {card.title}
                </h3>

                {/* --- BOTTOM ROW: Attendees, Register, Entry Fee --- */}
                <div className="flex justify-between items-center w-full">
                  <div className="flex flex-col gap-1">
                    <span className="inter font-normal text-[12px] leading-[150%] text-[#7C737E]">
                      Attendees
                    </span>
                    <div className="flex items-center gap-1">
                      <div className="flex items-start -space-x-1.5">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          fill="none"
                          className="z-30"
                        >
                          <circle cx="8" cy="8" r="8" fill="#FF7373" />
                        </svg>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          fill="none"
                          className="z-20"
                        >
                          <circle cx="8" cy="8" r="8" fill="#FFC068" />
                        </svg>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          fill="none"
                          className="z-10"
                        >
                          <circle cx="8" cy="8" r="8" fill="#CFFF9C" />
                        </svg>
                      </div>
                      <span className="inter font-medium text-[16px] leading-[150%] text-[#342636] ml-1">
                        {card.attendees}
                      </span>
                    </div>
                  </div>

                  {/* 2. Register By */}
                  <div className="flex flex-col gap-1">
                    <span className="inter font-normal text-[12px] leading-[150%] text-[#7C737E]">
                      Register by
                    </span>
                    <span className="inter font-medium text-[16px] leading-[150%] text-[#342636]">
                      {card.registerBy}
                    </span>
                  </div>

                  {/* 3. Entry Fee */}
                  <div className="flex flex-col gap-1">
                    <span className="inter font-normal text-[12px] leading-[150%] text-[#7C737E]">
                      Entry Fee
                    </span>
                    <span className="inter font-medium text-[16px] leading-[150%] text-[#342636]">
                      {card.entryFee}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
