import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Twitter, Linkedin, Facebook, Instagram } from "lucide-react";
import { SignedIn, SignedOut } from "@clerk/nextjs";

interface FooterLink {
  name: string;
  href: string;
  scroll?: boolean;
}

interface SocialLink {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  href: string;
  label: string;
}

interface FooterLinks {
  [key: string]: FooterLink[];
}

const Footer = () => {
  const footerLinks: FooterLinks = {
    Discover: [
      { name: "Competitions", href: "#competitions" },
      { name: "Events", href: "#events" },
    ],
    OppSkills: [
      { name: "Market Mafiaa", href: "https://marketmafiaa.com" },
      { name: "About Us", href: "/about" },
      { name: "Contact", href: "/contact" },
    ],
  };

  const socialLinks: SocialLink[] = [
    {
      icon: Linkedin,
      href: "https://www.linkedin.com/company/oppskills",
      label: "LinkedIn",
    },
    {
      icon: Instagram,
      href: "https://www.instagram.com/oppskills.global/",
      label: "Instagram",
    },
  ];

  return (
    <footer className="w-full px-4 sm:px-6 lg:px-8 pb-8 pt-12">
      <div className="max-w-340 mx-auto bg-[#030005] text-background rounded-[2.5rem] p-8 md:p-12 lg:p-16 overflow-hidden relative">
        {/* Top Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-12">
          <div className="flex items-center gap-3">
            <Image
              src="/logo.svg"
              alt="OppSkills Logo"
              width={200}
              height={200}
              className="object-contain"
            />
          </div>

          <div className="flex items-center gap-2 text-lg md:text-xl font-medium">
            <Link
              href="/organize/event"
              className="text-primary-foreground hover:underline"
            >
              <span>Create your events. </span>
              <span className="text-primary-400">Click here</span>
            </Link>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-background/10 w-full mb-12" />

        {/* Bottom Section */}
        <div className="flex flex-col lg:flex-row justify-between gap-12 lg:gap-8">
          {/* Links Columns */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-8 md:gap-16 lg:gap-24 grow">
            {/* Account Links */}
            <div className="space-y-6">
              <h4 className="text-lg font-semibold text-gray-200">
                Your Account
              </h4>
              <ul className="space-y-4">
                <SignedOut>
                  <li>
                    <Link
                      href="?auth=signup"
                      scroll={false}
                      className="text-gray-400 hover:text-background transition-colors text-base"
                    >
                      Sign up
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="?auth=login"
                      scroll={false}
                      className="text-gray-400 hover:text-background transition-colors text-base"
                    >
                      Sign in
                    </Link>
                  </li>
                </SignedOut>
                <SignedIn>
                  <li>
                    <Link
                      href="/dashboard"
                      className="text-gray-400 hover:text-background transition-colors text-base"
                    >
                      Profile
                    </Link>
                  </li>
                </SignedIn>
              </ul>
            </div>

            {Object.entries(footerLinks).map(([category, links]) => (
              <div key={category} className="space-y-6">
                <h4 className="text-lg font-semibold text-gray-200">
                  {category}
                </h4>
                <ul className="space-y-4">
                  {links.map((link, index) => (
                    <li key={index}>
                      <Link
                        href={link.href}
                        scroll={link.scroll}
                        className="text-gray-400 hover:text-background transition-colors text-base"
                      >
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Social Links Box */}
          <div className="lg:w-auto self-start">
            <div className="border border-background/10 rounded-2xl p-6 bg-background/5 backdrop-blur-sm pr-12 min-w-[280px]">
              <h4 className="text-lg font-semibold mb-6">Follow Us On</h4>
              <div className="flex items-center gap-4">
                {socialLinks.map((social, index) => {
                  const Icon = social.icon;
                  return (
                    <a
                      key={index}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 flex items-center justify-center rounded-full bg-background/10 hover:bg-background/20 transition-colors text-background"
                      aria-label={social.label}
                    >
                      <Icon className="w-5 h-5" />
                    </a>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
