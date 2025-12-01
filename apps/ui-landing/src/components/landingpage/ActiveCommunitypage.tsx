import React from "react";

const ActiveCommunitypage = () => {
  return (
    <section className="w-full flex justify-center bg-background">
      <div className="w-full max-w-[1440px] px-6 py-12 md:px-[60px] xl:px-[140px] xl:py-[48px] flex flex-col items-start gap-10">
        <div className="flex flex-col items-start gap-6 w-full">
          <h1 className="poppins font-semibold text-[32px] md:text-[48px] leading-[125%] text-[#100013]">
            Active Communities
          </h1>

          <p className="inter font-normal text-[16px] md:text-[20px] leading-[150%] text-[#7C737E] w-full max-w-[1158px]">
            Communities growing near you. Join, contribute, and learn from
            people who share your passion.{" "}
          </p>
        </div>
      </div>
    </section>
  );
};

export default ActiveCommunitypage;
