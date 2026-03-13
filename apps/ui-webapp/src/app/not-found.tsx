import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex h-[80vh] w-full flex-col items-center justify-center bg-background p-4 text-center">
      <div className="relative h-64 w-64 sm:h-80 sm:w-80 md:h-96 md:w-96">
        <Image
          src="/404.svg"
          alt="404 Page Not Found"
          fill
          className="object-contain"
          priority
        />
      </div>
      <div className="flex flex-col gap-6">
        <h1 className="font-semibold text-2xl w-full sm:w-sm text-neutral-800">
          This is a part of OppSkills world we haven’t discovered yet.
        </h1>
        <div>
          <Button asChild size="lg" className="rounded-full px-8">
            <Link href="/">
              <ChevronLeft /> Let's Go Back
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
