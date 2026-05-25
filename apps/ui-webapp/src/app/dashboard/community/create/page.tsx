import React from "react";
import RegsitrationForm from "./_components/RegsitrationForm";
import RegistrationSidebar from "./_components/RegistrationSidebar";

export default function CreateCommunityPage() {
  return (
    <div className="w-full min-h-screen bg-neutral-50 flex flex-col justify-start items-center">
      <div className="w-full max-w-7xl flex flex-col lg:flex-row gap-4">
        {/* Left Column: Form */}
        <div className="w-full lg:w-[62%] order-2 lg:order-1">
          <RegsitrationForm />
        </div>

        {/* Right Column: Sidebar */}
        <div className="w-full lg:w-[38%] order-1 lg:order-2 lg:sticky lg:top-8">
          <RegistrationSidebar />
        </div>
      </div>
    </div>
  );
}
