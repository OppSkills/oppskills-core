import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import Image from "next/image"; // Assuming you might use next/image if you had a real asset, but for now we might use a placeholder or lucide icon if image not available.
import React from "react";

interface EmptyStateProps {
  roleName: string;
  onAdd: () => void;
}

export default function EmptyState({ roleName, onAdd }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-6 text-center animate-in fade-in zoom-in duration-500">
      <div className="relative w-48 h-48 opacity-80">
        {/* Placeholder for the illustration in the image */}
        {/* In a real scenario, I'd use the uploaded image if I could process it to an asset, but user rules say I can't just create assets easily outside artifacts.
                    I will effectively simulate it or use a placeholder div that looks nice. */}
        <div className="w-full h-full bg-purple-50 rounded-full flex items-center justify-center">
          <div>
            <Image
              src="/characters/manager.svg"
              alt="Empty State"
              width={200}
              height={200}
            />
          </div>
        </div>
      </div>

      <div className="space-y-2 max-w-md">
        <h3 className="text-xl font-bold">
          No {roleName}(s) have been assigned yet
        </h3>
        <p className="text-muted-foreground text-sm">
          {roleName}(s) will have complete access to event they can do edits on
          your behalf
        </p>
      </div>

      <Button
        onClick={onAdd}
        className="bg-[#A020F0] hover:bg-[#8e1cd6] text-background rounded-full px-8 py-6 text-base font-semibold shadow-lg shadow-purple-900/20 transition-all hover:scale-105"
      >
        <PlusCircle className="w-5 h-5 mr-2" />
        Add {roleName}
      </Button>
    </div>
  );
}
