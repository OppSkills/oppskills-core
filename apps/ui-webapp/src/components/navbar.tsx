"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, PlusCircle, Search, Trophy, Calendar, Loader2 } from "lucide-react";
import Link from "next/link";
import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Auth from "./auth/Auth";
import { useQueryState } from "nuqs";
import Image from "next/image";
import { Input } from "./ui/input";
import { UserAccountButton } from "./user-account-button";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

function isNavLinkActive(href: string, pathname: string): boolean {
  if (href === "/") {
    return pathname === "/";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

const Navbar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [isSearching, setIsSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [authMode, setAuthMode] = useQueryState("auth");

  // Update local state when URL changes (e.g. user goes back/forward)
  useEffect(() => {
    setSearchQuery(searchParams.get("q") || "");
    setIsSearching(false);
  }, [searchParams]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setIsSearching(true);
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Hackathons", href: "/hackathons" },
    { name: "Festivals", href: "/festivals" },
    { name: "Events", href: "/events" },
  ];

  useEffect(() => {
    if (authMode) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [authMode]);

  return (
    <nav className="sticky top-0 z-50 w-full shadow-sm bg-neutral-100 px-4 md:px-8 py-4">
      <div className="flex items-center justify-between relative">
        {/* --- LOGO SECTION --- */}
        <Link
          href="/"
          className="flex items-center gap-2"
          onClick={() => setIsOpen(false)}
        >
          <Image src="/logo.svg" alt="Logo" width={140} height={30} />
        </Link>

        {/* --- DESKTOP NAVIGATION --- */}
        <div className="hidden lg:flex items-center gap-2 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          {navLinks.map((link) => {
            const active = isNavLinkActive(link.href, pathname);
            return (
              <Link
                key={link.name}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "text-base font-medium rounded-lg px-3 py-2 transition-colors",
                  active
                    ? "bg-primary/15 text-primary-700 font-semibold shadow-sm"
                    : "text-neutral-700 hover:text-primary-600 hover:bg-neutral-200/80",
                )}
              >
                {link.name}
              </Link>
            );
          })}
        </div>

        {/* --- RIGHT SIDE ACTIONS --- */}
        <div className="flex items-center gap-3">
          <div className="hidden xl:flex items-center justify-center">
            <form onSubmit={handleSearch} className="relative w-full max-w-[300px]">
              <Input
                type="text"
                placeholder="Search"
                className="w-full rounded-full border-neutral-400 py-2"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button
                type="submit"
                disabled={isSearching}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-primary-500 transition-colors disabled:opacity-50"
              >
                {isSearching ? (
                  <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
                ) : (
                  <Search className="h-6 w-6" />
                )}
              </button>
            </form>
          </div>

          {/* User actions / auth */}
          <div className="flex items-center gap-3">
            <SignedIn>
              {/* Desktop Host button */}
              <div className="hidden lg:block">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="border-primary-200 rounded-full text-primary-700 hover:bg-primary-500 hover:text-primary-foreground focus-visible:ring-0 focus-visible:ring-offset-0"
                    >
                      <PlusCircle className="w-4 h-4 mr-1.5" />
                      Host
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 rounded-xl border-neutral-200 mt-1">
                    <Link href="/organize/hackathon">
                      <DropdownMenuItem className="cursor-pointer py-3 focus:bg-primary-50 focus:text-primary-700">
                        <Trophy className="mr-2.5 h-4 w-4 text-neutral-500" />
                        <span className="font-medium">Hackathon</span>
                      </DropdownMenuItem>
                    </Link>
                    <Link href="/organize/event">
                      <DropdownMenuItem className="cursor-pointer py-3 focus:bg-primary-50 focus:text-primary-700">
                        <Calendar className="mr-2.5 h-4 w-4 text-neutral-500" />
                        <span className="font-medium">Event</span>
                      </DropdownMenuItem>
                    </Link>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Profile Icon (Desktop & Mobile) */}
              <UserAccountButton />
            </SignedIn>

            <SignedOut>
              <Button
                onClick={() => {
                  setAuthMode("login");
                }}
                className="hidden lg:block bg-primary-500 text-primary-foreground hover:bg-primary/90"
              >
                Sign In / Sign Up
              </Button>
            </SignedOut>
          </div>

          {/* Mobile Menu Trigger */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
      </div>

      {/* --- MOBILE MENU --- */}
      {isOpen && (
        <div className="lg:hidden pt-4 pb-6 space-y-4 animate-in slide-in-from-top-5">
          {/* Mobile Search */}
          <div className="px-2 mb-4">
            <form onSubmit={(e) => { handleSearch(e); setIsOpen(false); }} className="relative w-full">
              <Input
                type="text"
                placeholder="Search"
                className="w-full rounded-full border-neutral-400 py-2 pl-4 pr-12"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button
                type="submit"
                disabled={isSearching}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-primary-500 transition-colors disabled:opacity-50"
              >
                {isSearching ? (
                  <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
                ) : (
                  <Search className="h-6 w-6" />
                )}
              </button>
            </form>
          </div>
          <div className="flex flex-col gap-1">
            {navLinks.map((link) => {
              const active = isNavLinkActive(link.href, pathname);
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "rounded-lg px-3 py-2.5 text-lg font-medium transition-colors",
                    active
                      ? "bg-primary/15 text-primary-700 font-semibold"
                      : "text-foreground hover:bg-neutral-200/80 hover:text-primary-600",
                  )}
                  onClick={() => setIsOpen(false)}
                >
                  {link.name}
                </Link>
              );
            })}

            {/* Mobile Action Buttons */}
            <div className="flex flex-col gap-3 mt-4">
              <SignedIn>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full border-primary-200 text-primary-700 rounded-xl"
                    >
                      <PlusCircle className="w-4 h-4 mr-2" /> Host
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-[calc(100vw-48px)] rounded-xl border-neutral-200 bg-white shadow-lg mx-2">
                    <Link href="/organize/hackathon" onClick={() => setIsOpen(false)}>
                      <DropdownMenuItem className="cursor-pointer py-4 px-4 text-lg">
                        <Trophy className="mr-3 h-5 w-5 text-neutral-500" />
                        <span>Hackathon</span>
                      </DropdownMenuItem>
                    </Link>
                    <Link href="/organize/event" onClick={() => setIsOpen(false)}>
                      <DropdownMenuItem className="cursor-pointer py-4 px-4 text-lg border-t">
                        <Calendar className="mr-3 h-5 w-5 text-neutral-500" />
                        <span>Event</span>
                      </DropdownMenuItem>
                    </Link>
                  </DropdownMenuContent>
                </DropdownMenu>
              </SignedIn>

              <SignedOut>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full border-primary-500 text-primary rounded-xl"
                    >
                      <PlusCircle className="w-4 h-4 mr-2" /> Host
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-[calc(100vw-48px)] rounded-xl border-neutral-200 bg-white shadow-lg mx-2">
                    <Link href="/organize/hackathon" onClick={() => setIsOpen(false)}>
                      <DropdownMenuItem className="cursor-pointer py-4 px-4 text-lg">
                        <Trophy className="mr-3 h-5 w-5 text-neutral-500" />
                        <span>Hackathon</span>
                      </DropdownMenuItem>
                    </Link>
                    <Link href="/organize/event" onClick={() => setIsOpen(false)}>
                      <DropdownMenuItem className="cursor-pointer py-4 px-4 text-lg border-t">
                        <Calendar className="mr-3 h-5 w-5 text-neutral-500" />
                        <span>Event</span>
                      </DropdownMenuItem>
                    </Link>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button
                  onClick={() => {
                    setAuthMode("login");
                    setIsOpen(false);
                  }}
                  className="w-full bg-primary-500 text-foreground"
                >
                  Sign In / Sign Up
                </Button>
              </SignedOut>
            </div>
          </div>
        </div>
      )}
      {authMode && <Auth onClose={() => setAuthMode(null)} />}
    </nav>
  );
};

export default Navbar;
