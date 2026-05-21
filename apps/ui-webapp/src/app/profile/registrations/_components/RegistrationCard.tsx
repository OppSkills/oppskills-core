"use client";

import Image from "next/image";
import { Registration } from "./registration-types";
import { RegistrationStepper } from "./RegistrationStepper";

import Link from "next/link";
import { cn } from "@/lib/utils";

interface RegistrationCardProps {
  registration: Registration;
}

export function RegistrationCard({ registration }: RegistrationCardProps) {
  const detailLink = `/${registration.opportunityType === "hackathon" ? "hackathons" : "events"}/${registration.slug}`;

  return (
    <Link href={detailLink} className="block group/card">
      <div className="bg-white border border-[#E0E0E6] rounded-[32px] p-4 md:p-6 mb-6 flex flex-col xl:flex-row gap-6 hover:shadow-lg hover:border-primary-200 transition-all relative overflow-hidden">
        {/* Banner */}
        <div className="w-full xl:w-[280px] h-[180px] shrink-0 relative rounded-2xl overflow-hidden">
          <Image
            src={registration.bannerUrl}
            alt={registration.title}
            fill
            className="object-cover transition-transform duration-500 group-hover/card:scale-110"
          />
          <div className="absolute inset-0 bg-black/10 group-hover/card:bg-black/20 transition-colors" />
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col justify-between">
          <div>
            <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-4">
              <h3 className="text-2xl font-bold text-[#1A1A1E] group-hover/card:text-primary-600 transition-colors">
                {registration.title}
              </h3>
            </div>
            <div className="text-sm xl:w-3/4">
              {/* First Line (max width + truncate) */}
              <div className="flex items-center max-w-full overflow-hidden">
                {[
                  { title: "Registered On", value: registration.registeredOn },
                  { title: "By", value: registration.registeredBy },
                  { title: "Team Name", value: registration.teamName },
                ].map((item, i, arr) => (
                  <div
                    key={i}
                    className={cn(
                      "flex items-center min-w-0",
                      i === 2 && "hidden lg:flex",
                    )}
                  >
                    <p className="text-neutral-700 font-medium text-xs truncate">
                      {item.title}:{" "}
                      <span className="text-neutral-600 font-normal">
                        {item.value}
                      </span>
                    </p>

                    {/* Divider */}
                    {i < arr.length - 1 && (
                      <div
                        className={cn(
                          "mx-2 w-px h-3 bg-neutral-500 shrink-0",
                          i === 1 && "hidden lg:block",
                        )}
                      />
                    )}
                  </div>
                ))}
              </div>

              {/* Second Line (Deadline) */}
              <div className="mt-1 flex items-center max-w-full overflow-hidden">
                {[
                  { title: "Team Name", value: registration.teamName },
                  { title: "Deadline", value: registration.deadline },
                ].map((item, i, arr) => (
                  <div
                    key={i}
                    className={cn(
                      "items-center min-w-0",
                      i === 0 && "flex lg:hidden",
                    )}
                  >
                    <p className="text-neutral-700 font-medium text-xs truncate">
                      {item.title}:{" "}
                      <span className="text-neutral-600 font-normal">
                        {item.value}
                      </span>
                    </p>

                    {/* Divider */}
                    {i < arr.length - 1 && (
                      <div className="mx-2 w-px h-3 bg-neutral-500 shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Stepper */}
          <div className="pb-8">
            <RegistrationStepper stages={registration.stages} />
          </div>
        </div>
      </div>
    </Link>
  );
}
