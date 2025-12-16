'use client';

import './main.css';

interface AboutSectionProps {
  content: string;
}

export function AboutSection({ content }: AboutSectionProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
        About Hackathon
      </h2>
      <div 
        className="html-content"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </div>
  );
}
