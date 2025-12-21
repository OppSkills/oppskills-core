import React from "react";
import { Card, CardContent, CardFooter } from "../card";
import Image from "next/image";
import { Badge } from "../badge";
import { IndianRupee } from "lucide-react";
import RTooltip from "../Rtooltip";
import { Tooltip, TooltipContent, TooltipTrigger } from "../tooltip";

export default function EventCard({
  thumbnail = "",
  title,
  location,
}: {
  thumbnail?: string;
  title: string;
  location: string;
}) {
  return (
    <Card className="p-0 shadow-lg rounded-2xl overflow-hidden gap-0">
      <CardContent className="p-0">
        <div className="h-[220px] overflow-hidden flex items-center justify-center">
          <Image
            width={371}
            height={371}
            src={thumbnail || "/tmp/hackathon.jpg"}
            alt="Hackathon Thumbnail"
            style={{ objectFit: "cover" }}
          />
        </div>
      </CardContent>
      <CardFooter className="p-4 m-0">
        <div className="w-full flex flex-col gap-3">
          <div className="w-full flex justify-between">
            <h1 className="text-lg truncate">{title || "Event Name"}</h1>
            <div className="flex gap-2">
              {["Online", "Free"].map((badge, index) => (
                <Badge key={index} variant="secondary">
                  {badge}
                </Badge>
              ))}
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            {location || (
              <span className="text-muted-foreground italic">LOCATION</span>
            )}
          </p>
          <div className="flex w-full justify-between">
            <div className="flex flex-col gap-1">
              <p className="text-xs font-semibold">Impression</p>
              <p className="text-xs text-muted-foreground">17,070</p>
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-xs font-semibold">Register By</p>
              <p className="text-xs text-muted-foreground">3,423</p>
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-xs font-semibold">Prizes Worth</p>
              <p className="text-xs text-muted-foreground flex">
                <IndianRupee className="w-4 h-4" /> 10,000
              </p>
            </div>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
