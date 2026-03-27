"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, PlusCircle, Search, Trophy, Calendar } from "lucide-react";
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

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [authMode, setAuthMode] = useQueryState("auth");

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
        <div className="hidden lg:flex items-center gap-8 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="text-base font-medium text-neutral-700"
            >
              {link.name}
            </Link>
          ))}
        </div>

        {/* --- RIGHT SIDE ACTIONS --- */}
        <div className="flex items-center gap-3">
          <div className="hidden xl:flex items-center justify-center">
            <div className="relative w-full max-w-[300px]">
              <Input
                type="text"
                placeholder="Search"
                className="w-full rounded-full border-neutral-400 py-2"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400">
                <Search className="h-6 w-6" />
              </div>
            </div>
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
          <div className="flex flex-col gap-4">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="text-foreground hover:text-primary-500 transition-colors text-lg font-medium px-2"
                onClick={() => setIsOpen(false)}
              >
                {link.name}
              </Link>
            ))}

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
