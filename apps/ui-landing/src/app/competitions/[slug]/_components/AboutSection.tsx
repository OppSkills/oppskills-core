"use client";

import "./main.css";

interface AboutSectionProps {
  content: string;
}

export function AboutSection({ content }: AboutSectionProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-neutral-900 ">About Hackathon</h2>
      <div
        className="html-content whitespace-pre-line"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </div>
  );
}
