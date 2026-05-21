import React, { forwardRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface SwiperControlsProps {
  setPrevEl: (node: HTMLButtonElement | null) => void;
  setNextEl: (node: HTMLButtonElement | null) => void;
  setPaginationEl: (node: HTMLDivElement | null) => void;
}

const Button = forwardRef<
  HTMLButtonElement,
  { children: React.ReactNode; label: string; className?: string }
>(({ children, label, className }, ref) => (
  <button
    ref={ref}
    className={`w-10 h-10 rounded-full border border-border bg-background hover:bg-muted flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed z-10 ${className || ""}`}
    aria-label={label}
  >
    {children}
  </button>
));

Button.displayName = "Button";

export const SwiperControls: React.FC<SwiperControlsProps> = ({
  setPrevEl,
  setNextEl,
  setPaginationEl,
}) => {
  return (
    <div className="flex justify-center items-center">
      <div className="flex justify-center items-center mt-8 gap-4 w-fit!">
        <Button
          ref={setPrevEl}
          label="Previous slide"
          className="hidden sm:flex"
        >
          <ChevronLeft className="w-5 h-5 text-foreground" />
        </Button>

        <div
          ref={setPaginationEl}
          className="flex justify-center items-center gap-1 h-6"
        />

        <Button ref={setNextEl} label="Next slide" className="hidden sm:flex">
          <ChevronRight className="w-5 h-5 text-foreground" />
        </Button>
      </div>
    </div>
  );
};
