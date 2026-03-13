"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, Plus, PlusCircle, Search } from "lucide-react";
import Link from "next/link";
import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
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
          {/* Desktop Buttons (Hidden on Mobile) */}
          <div className="hidden lg:flex items-center gap-3">
            {/* Logic for Authenticated Users */}
            <SignedIn>
              <Link href="/organize">
                <Button
                  variant="outline"
                  className="border-primary-200 rounded-full text-primary-700 hover:bg-primary-500 hover:text-primary-foreground"
                >
                  <PlusCircle className="w-4 h-4" />
                  Host
                </Button>
              </Link>
              <UserAccountButton />
            </SignedIn>

            {/* Logic for Guests */}
            <SignedOut>
              <Button
                onClick={() => {
                  setAuthMode("login");
                }}
                className="bg-primary-500 text-primary-foreground hover:bg-primary/90"
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
                <Link href="/organize" onClick={() => setIsOpen(false)}>
                  <Button
                    variant="outline"
                    className="w-full border-primary-200 text-primary-700"
                  >
                    <PlusCircle className="w-4 h-4 mr-2" /> Host
                  </Button>
                </Link>
                <Link href="/dashboard" onClick={() => setIsOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start px-2">
                    Dashboard
                  </Button>
                </Link>
                <div className="px-2">
                  <UserAccountButton />
                </div>
              </SignedIn>

              <SignedOut>
                <Link href="/organize" onClick={() => setIsOpen(false)}>
                  <Button
                    variant="outline"
                    className="w-full border-primary-500 text-primary"
                  >
                    <Plus className="w-4 h-4 mr-2" /> Host
                  </Button>
                </Link>
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
