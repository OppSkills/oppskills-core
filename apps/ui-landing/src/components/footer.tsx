import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Twitter, Linkedin, Facebook, Instagram } from "lucide-react";

interface FooterLink {
  name: string;
  href: string;
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
    "Your Account": [
      { name: "Sign up", href: "/signup" },
      { name: "Sign in", href: "/signin" },
      { name: "Help", href: "/help" },
    ],
    Discover: [
      { name: "Competitions", href: "/competitions" },
      { name: "Events", href: "/events" },
      { name: "Communities", href: "/communities" },
    ],
    OppSkills: [
      { name: "About", href: "/about" },
      { name: "Team", href: "/team" },
      { name: "Blogs", href: "/blogs" },
      { name: "Market Mafiyaa", href: "/market-mafiyaa" },
      { name: "Impact", href: "/impact" },
    ],
  };

  const socialLinks: SocialLink[] = [
    { icon: Facebook, href: "https://facebook.com/oppskills", label: "Facebook" },
    { icon: Instagram, href: "https://instagram.com/oppskills", label: "Instagram" },
    { icon: Linkedin, href: "https://linkedin.com/company/oppskills", label: "LinkedIn" },
    { icon: Twitter, href: "https://twitter.com/oppskills", label: "Twitter" },
  ];

  return (
    <footer className="w-full px-4 sm:px-6 lg:px-8 pb-8 pt-12">
      <div className="max-w-340 mx-auto bg-[#030005] text-white rounded-[2.5rem] p-8 md:p-12 lg:p-16 overflow-hidden relative">
        {/* Top Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-12">
          <div className="flex items-center gap-3">
            {/* Logo */}
            <div className="relative w-12 h-12">
              <Image
                src="/logof.png"
                alt="OppSkills Logo"
                fill
                className="object-contain"
              />
            </div>
            <div className="flex flex-col md:flex-row gap-0 md:gap-6 items-center">
              <p className="text-xl md:text-2xl font-bold tracking-tight w-full md:w-auto">
                OPP<span className="text-[#a855f7]">SKILLS</span>
              </p>
              <p className="text-lg md:text-xl font-bold">
                The <span className="text-[#a855f7]">Student’s</span> platform
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-lg md:text-xl font-medium">
            <span>Create your events.</span>
            <Link href="/create-event" className="text-[#d946ef] hover:underline">
              Click here
            </Link>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-white/10 w-full mb-12" />

        {/* Bottom Section */}
        <div className="flex flex-col lg:flex-row justify-between gap-12 lg:gap-8">
          {/* Links Columns */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-8 md:gap-16 lg:gap-24 flex-grow">
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
                        className="text-gray-400 hover:text-white transition-colors text-base"
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
            <div className="border border-white/10 rounded-2xl p-6 bg-white/5 backdrop-blur-sm pr-12 min-w-[280px]">
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
                      className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white"
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
