import React from "react";
import Stages from "./_components/Stages";
import Participants from "./_components/Participants";

export default function page() {
  return (
    <div className="flex w-full justify-center bg-surface">
      <div className="w-full p-10 rounded-[20px] bg-background">
        <Stages />
        <div className="h-px my-6 w-full bg-foreground/30" />
        <Participants />
      </div>
    </div>
  );
}
