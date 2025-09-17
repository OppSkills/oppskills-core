"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { Menu, Calendar, Users, Trophy, X } from "lucide-react";
import { ModeToggle } from "@/components/mode-toggle";
import Link from "next/link";
import Image from "next/image";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const dropdownItems = [
    {
      name: "Events",
      href: "/events",
      icon: Calendar,
      description: "Discover upcoming events",
    },
    {
      name: "Hackathons",
      href: "/hackathons",
      icon: Trophy,
      description: "Join coding challenges",
    },
    {
      name: "Communities",
      href: "/communities",
      icon: Users,
      description: "Connect with like-minded people",
    },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full pb-0.5 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 ">
      <div className="container mx-auto px-4 max-w-[90rem]">
        <div className="flex h-16 items-center justify-between">
          {/* Left Side - Logo and Links */}
          <div className="flex items-center space-x-8">
            {/* Logo */}
            <Link href="/" className="">
              <Image
                src="/logob.png"
                alt="OppSkills Logo"
                width={200}
                height={80}
                className="h-20 w-auto dark:hidden object-cover"
              />
              <Image
                src="/logow.png"
                alt="OppSkills Logo"
                width={200}
                height={96}
                className="h-24 w-auto hidden dark:block"
              />
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center">
              <NavigationMenu>
                <NavigationMenuList>
                  {/* Home Link */}
                  <NavigationMenuItem>
                    <NavigationMenuLink asChild>
                      <Link
                        href="/"
                        className="group inline-flex w-max items-center justify-center rounded-md px-4 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-0 active:bg-transparent"
                      >
                        Home
                      </Link>
                    </NavigationMenuLink>
                  </NavigationMenuItem>

                  {/* Dropdown Menu */}
                  <NavigationMenuItem>
                    <NavigationMenuTrigger className={"bg-transparent"}>
                      Explore
                    </NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <ul className="grid w-[400px] gap-3 p-4 md:grid-cols-1">
                        {dropdownItems.map((item) => (
                          <li key={item.name}>
                            <NavigationMenuLink asChild>
                              <Link
                                className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-0 active:bg-transparent"
                                href={item.href}
                              >
                                <div className="flex items-center space-x-2">
                                  <item.icon className="h-4 w-4" />
                                  <div className="text-sm font-medium leading-none">
                                    {item.name}
                                  </div>
                                </div>
                                <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                                  {item.description}
                                </p>
                              </Link>
                            </NavigationMenuLink>
                          </li>
                        ))}
                      </ul>
                    </NavigationMenuContent>
                  </NavigationMenuItem>

                  {/* About Link */}
                  <NavigationMenuItem>
                    <NavigationMenuLink asChild>
                      <Link
                        href="/about"
                        className="group inline-flex w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-0 active:bg-transparent"
                      >
                        About
                      </Link>
                    </NavigationMenuLink>
                  </NavigationMenuItem>

                  {/* Contact Link */}
                  <NavigationMenuItem>
                    <NavigationMenuLink asChild>
                      <Link
                        href="/contact"
                        className="group inline-flex w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-0 active:bg-transparent"
                      >
                        Contact
                      </Link>
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                </NavigationMenuList>
              </NavigationMenu>
            </div>
          </div>

          {/* Right Side - Buttons */}
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center space-x-2">
              <Button variant="outline" size="lg">
                Host an Event
              </Button>
              <Button size="lg">Log In</Button>
            </div>

            <div className="border border-border rounded-md">
              <ModeToggle />
            </div>

            {/* Mobile Menu Button */}
            <Button
              variant="outline"
              size="icon"
              className="md:hidden"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
              <span className="sr-only">Toggle menu</span>
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden border-t border-border/40 bg-background/95 backdrop-blur-md">
            <div className="px-4 py-6 space-y-4">
              {/* Mobile Navigation Links */}
              <div className="space-y-2">
                <Link
                  href="/"
                  className="block px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground rounded-md transition-colors focus-visible:outline-none focus-visible:ring-0 active:bg-transparent"
                  onClick={() => setIsOpen(false)}
                >
                  Home
                </Link>
              </div>

              {/* Mobile Dropdown Items */}
              <div className="space-y-2">
                <div className="px-3 py-2 text-sm font-semibold text-muted-foreground">
                  Explore
                </div>
                {dropdownItems.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="flex items-center space-x-3 px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground rounded-md transition-colors focus-visible:outline-none focus-visible:ring-0 active:bg-transparent"
                    onClick={() => setIsOpen(false)}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </Link>
                ))}
              </div>

              {/* Mobile Other Links */}
              <div className="space-y-2">
                <Link
                  href="/about"
                  className="flex items-center space-x-3 px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground rounded-md transition-colors focus-visible:outline-none focus-visible:ring-0 active:bg-transparent"
                  onClick={() => setIsOpen(false)}
                >
                  <span>About</span>
                </Link>
                <Link
                  href="/contact"
                  className="flex items-center space-x-3 px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground rounded-md transition-colors focus-visible:outline-none focus-visible:ring-0 active:bg-transparent"
                  onClick={() => setIsOpen(false)}
                >
                  <span>Contact</span>
                </Link>
              </div>

              {/* Mobile Buttons */}
              <div className="pt-4 space-y-2">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setIsOpen(false)}
                >
                  Host an Event
                </Button>
                <Button className="w-full" onClick={() => setIsOpen(false)}>
                  Log In
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
