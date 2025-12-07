"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, Plus } from "lucide-react";
import Link from "next/link";
import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import Auth from "./auth/Auth";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isOpenLogin, setIsOpenLogin] = useState(false);

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Opportunities", href: "/events" },
    { name: "Communities", href: "/communities" },
    { name: "About", href: "/about" },
    { name: "Contact", href: "/contact" },
  ];

  useEffect(() => {
    if (isOpenLogin) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpenLogin]);

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 md:px-8 py-4">
      <div className="flex items-center justify-between">
        {/* --- LOGO SECTION --- */}
        <Link
          href="/"
          className="flex items-center gap-2"
          onClick={() => setIsOpen(false)}
        >
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-background" />
          </div>
          <span className="text-xl font-bold">
            OPP<span className="text-primary">SKILLS</span>
          </span>
        </Link>

        {/* --- DESKTOP NAVIGATION --- */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="text-foreground hover:text-primary transition-colors text-sm font-medium"
            >
              {link.name}
            </Link>
          ))}
        </div>

        {/* --- RIGHT SIDE ACTIONS --- */}
        <div className="flex items-center gap-3">
          {/* Desktop Buttons (Hidden on Mobile) */}
          <div className="hidden md:flex items-center gap-3">
            {/* Logic for Authenticated Users */}
            <SignedIn>
              <Link href="/organizer">
                <Button
                  variant="outline"
                  className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Host
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="ghost">Dashboard</Button>
              </Link>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>

            {/* Logic for Guests */}
            <SignedOut>
              <Link href="/organizer">
                <Button
                  variant="outline"
                  className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Host
                </Button>
              </Link>
              <Button onClick={() => { setIsOpenLogin(true) }} className="bg-primary text-primary-foreground hover:bg-primary/90">
                Sign In / Sign Up
              </Button>
            </SignedOut>
          </div>

          {/* Mobile Menu Trigger */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
      </div>

      {/* --- MOBILE MENU --- */}
      {isOpen && (
        <div className="md:hidden pt-4 pb-6 space-y-4 animate-in slide-in-from-top-5">
          <div className="flex flex-col gap-4">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="text-foreground hover:text-primary transition-colors text-lg font-medium px-2"
                onClick={() => setIsOpen(false)}
              >
                {link.name}
              </Link>
            ))}

            {/* Mobile Action Buttons */}
            <div className="flex flex-col gap-3 mt-4">
              <SignedIn>
                <Link href="/organizer" onClick={() => setIsOpen(false)}>
                  <Button
                    variant="outline"
                    className="w-full border-primary text-primary"
                  >
                    <Plus className="w-4 h-4 mr-2" /> Host
                  </Button>
                </Link>
                <Link href="/dashboard" onClick={() => setIsOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start px-2">
                    Dashboard
                  </Button>
                </Link>
                <div className="px-2">
                  <UserButton afterSignOutUrl="/" />
                </div>
              </SignedIn>

              <SignedOut>
                <Link href="/organizer" onClick={() => setIsOpen(false)}>
                  <Button
                    variant="outline"
                    className="w-full border-primary text-primary"
                  >
                    <Plus className="w-4 h-4 mr-2" /> Host
                  </Button>
                </Link>
                <Button onClick={() => { setIsOpenLogin(true) }} className="w-full bg-primary text-primary-foreground">
                  Sign In / Sign Up
                </Button>
              </SignedOut>
            </div>
          </div>
        </div>
      )}
      {isOpenLogin && <Auth setIsOpenLogin={setIsOpenLogin} />}
    </nav>
  );
};

export default Navbar;

