import Image from "next/image";

interface NoDataPlaceholderProps {
  message?: string;
  description?: string;
  className?: string;
}

export default function NoDataPlaceholder({
  message = "No data available yet",
  description,
  className = "h-[300px]",
}: NoDataPlaceholderProps) {
  return (
    <div
      className={`w-full bg-background rounded-[20px] p-6 border border-border flex flex-col items-center justify-center text-center ${className}`}
    >
      <div className="relative w-30 h-30 mb-4">
        <Image
          src="/illustrations/no_data.svg"
          alt="No data"
          fill
          className="object-contain opacity-80"
        />
      </div>
      <p className="text-base font-semibold text-foreground poppins">
        {message}
      </p>
      {description && (
        <p className="text-sm text-muted-foreground mt-1 inter">
          {description}
        </p>
      )}
    </div>
  );
}
