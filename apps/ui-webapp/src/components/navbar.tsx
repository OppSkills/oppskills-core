"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, PlusCircle, Search, Trophy, Calendar, Loader2 } from "lucide-react";
import Link from "next/link";
import { SignedIn, SignedOut } from "@clerk/nextjs";
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
import { NavbarSearch } from "./navbar-search";

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
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [authMode, setAuthMode] = useQueryState("auth");

  // Update local state when URL changes (e.g. user goes back/forward)
  useEffect(() => {
    setSearchQuery(searchParams.get("q") || "");
    setIsSearching(false);
    setIsSearchFocused(false);
  }, [searchParams]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setIsSearching(true);
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setIsOpen(false);
      setIsSearchFocused(false);
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

  const isSearchingMobile = isOpen && (isSearchFocused || searchQuery.trim().length > 0);

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
        <div className="hidden lg:flex items-center gap-8 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          {navLinks.map((link) => {
            const active = isNavLinkActive(link.href, pathname);
            return (
              <Link
                key={link.name}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "text-base font-medium pb-1 border-b-2 transition-colors",
                  active
                    ? "text-primary-700 border-primary-600"
                    : "text-neutral-700 border-transparent hover:text-neutral-900",
                )}
              >
                {link.name}
              </Link>
            );
          })}
        </div>

        {/* --- RIGHT SIDE ACTIONS --- */}
        <div className="flex items-center gap-3">
          <div className="hidden xl:flex items-center justify-center relative">
            <form onSubmit={handleSearch} className="relative w-full max-w-[300px]">
              <Input
                type="text"
                placeholder="Search"
                className="w-full rounded-full border-neutral-400 py-2"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
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

          <div className="flex items-center gap-3">
            <SignedIn>
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
              <UserAccountButton />
            </SignedIn>

            <SignedOut>
              <Button
                onClick={() => setAuthMode("login")}
                className="hidden lg:block rounded-full"
              >
                Sign In / Sign Up
              </Button>
            </SignedOut>
          </div>

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
        <div className={cn(
          "lg:hidden pt-4 pb-6 space-y-4 animate-in slide-in-from-top-5 fixed inset-x-0 top-[72px] bottom-0 bg-neutral-100 z-40 overflow-y-auto px-4",
          isSearchingMobile && "bg-white"
        )}>
          {/* Mobile Search */}
          <div className="mb-4">
            <form onSubmit={handleSearch} className="relative w-full">
              <Input
                type="text"
                placeholder="Search hackathons, events..."
                className="w-full rounded-full border-neutral-400 py-3 pl-4 pr-12 text-lg"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
              />
              <button
                type="submit"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400"
              >
                <Search className="h-6 w-6" />
              </button>
            </form>
          </div>

          {/* Hide mobile links when searching to give space to results */}
          {!isSearchingMobile && (
            <div className="flex flex-col gap-2">
              {navLinks.map((link) => {
                const active = isNavLinkActive(link.href, pathname);
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    className={cn(
                      "px-4 py-4 text-xl font-semibold rounded-2xl transition-colors",
                      active ? "bg-primary-50 text-primary-700" : "text-neutral-700 hover:bg-neutral-200"
                    )}
                    onClick={() => setIsOpen(false)}
                  >
                    {link.name}
                  </Link>
                );
              })}

              <div className="mt-6 pt-6 border-t border-neutral-200 space-y-4">
                <SignedIn>
                   <div className="space-y-4">
                      <p className="text-sm font-bold text-neutral-400 uppercase tracking-widest px-4">Organize</p>
                      <Link href="/organize/hackathon" onClick={() => setIsOpen(false)} className="flex items-center gap-4 px-4 py-4 rounded-2xl hover:bg-neutral-200">
                        <Trophy className="w-6 h-6 text-neutral-500" />
                        <span className="text-xl font-semibold">Hackathon</span>
                      </Link>
                      <Link href="/organize/event" onClick={() => setIsOpen(false)} className="flex items-center gap-4 px-4 py-4 rounded-2xl hover:bg-neutral-200">
                        <Calendar className="w-6 h-6 text-neutral-500" />
                        <span className="text-xl font-semibold">Event</span>
                      </Link>
                   </div>
                </SignedIn>

                <SignedOut>
                  <Button
                    onClick={() => {
                      setAuthMode("login");
                      setIsOpen(false);
                    }}
                    className="w-full py-6 text-xl rounded-2xl"
                  >
                    Sign In / Sign Up
                  </Button>
                </SignedOut>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Suggestion Dropdown (Global) */}
      <NavbarSearch 
        query={searchQuery} 
        isOpen={(isSearchFocused || searchQuery.trim().length > 0) && (isOpen || !isOpen)} // Always allow if focused
        onClose={() => {
          setIsSearchFocused(false);
        }} 
      />

      {authMode && <Auth onClose={() => setAuthMode(null)} />}
    </nav>
  );
};

export default Navbar;
