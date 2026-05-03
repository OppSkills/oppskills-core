"use client";

import DOMPurify from "isomorphic-dompurify";
import "./main.css";

interface AboutSectionProps {
  content: string;
}

export function AboutSection({ content }: AboutSectionProps) {
  return (
    <div className="space-y-4">
      <h2 className="ProseMirror text-3xl font-semibold text-neutral-800 ">About Hackathon</h2>
      <div
        className="html-content whitespace-pre-line break-words"
        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content) }}
      />
    </div>
  );
}

