import React from "react";
import { Badge } from "@/components/ui/badge";
import {
  Github,
  Twitter,
  Linkedin,
  Mail,
  MapPin,
  Globe,
  ArrowRight,
} from "lucide-react";

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
    Platform: [
      { name: "Communities", href: "/communities" },
      { name: "Events", href: "/events" },
      { name: "Hackathons", href: "/hackathons" },
      { name: "Host Event", href: "/host" },
    ],
    Resources: [
      { name: "Help Center", href: "/help" },
      { name: "Contact", href: "/contact" },
      { name: "Blog", href: "/blog" },
      { name: "API Docs", href: "/docs" },
    ],
    Company: [
      { name: "About Us", href: "/about" },
      { name: "Careers", href: "/careers" },
      { name: "Press", href: "/press" },
      { name: "Partners", href: "/partners" },
    ],
    Legal: [
      { name: "Privacy Policy", href: "/privacy" },
      { name: "Terms of Service", href: "/terms" },
      { name: "Cookie Policy", href: "/cookies" },
      { name: "Guidelines", href: "/guidelines" },
    ],
  };

  const socialLinks: SocialLink[] = [
    { icon: Twitter, href: "https://twitter.com/oppskills", label: "Twitter" },
    { icon: Github, href: "https://github.com/oppskills", label: "GitHub" },
    {
      icon: Linkedin,
      href: "https://linkedin.com/company/oppskills",
      label: "LinkedIn",
    },
    { icon: Mail, href: "mailto:hello@oppskills.com", label: "Email" },
  ];

  return (
    <footer className="bg-card border-t border-border/50">
      <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="pt-12 sm:pt-16 pb-8">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
            {/* Brand Section */}
            <div className="col-span-2 lg:col-span-2">
              <div className="mb-6">
                <h3 className="text-xl font-bold text-foreground mb-3">
                  OppSkills
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
                  Connect, learn, and grow with the largest community of tech
                  professionals across India.
                </p>
              </div>

              {/* Contact Info */}
              <div className="space-y-2 mb-6">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span>Bangalore, India</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Globe className="w-4 h-4" />
                  <span>Available across India</span>
                </div>
              </div>

              {/* Social Links */}
              <div className="flex items-center gap-3">
                {socialLinks.map((social: SocialLink, index: number) => {
                  const IconComponent = social.icon;
                  return (
                    <a
                      key={index}
                      href={social.href}
                      aria-label={social.label}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-9 h-9 rounded-lg bg-secondary/50 hover:bg-primary/10 flex items-center justify-center transition-colors group"
                    >
                      <IconComponent className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </a>
                  );
                })}
              </div>
            </div>

            {/* Footer Links */}
            {Object.entries(footerLinks).map(
              ([category, links]: [string, FooterLink[]]) => (
                <div key={category} className="space-y-4">
                  <h4 className="text-sm font-semibold text-foreground">
                    {category}
                  </h4>
                  <ul className="space-y-3">
                    {links.map((link: FooterLink, index: number) => (
                      <li key={index}>
                        <a
                          href={link.href}
                          className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1 group"
                        >
                          {link.name}
                          <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )
            )}
          </div>
        </div>

        {/* Newsletter Section */}
        <div className="py-8 border-t border-border/30">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div className="flex-1">
              <h4 className="text-base font-semibold text-foreground mb-2">
                Stay updated
              </h4>
              <p className="text-sm text-muted-foreground">
                Get notified about new events, hackathons, and opportunities
                across India.
              </p>
            </div>

            <form className="flex flex-col sm:flex-row gap-3 sm:max-w-md">
              <input
                type="email"
                placeholder="Enter your email"
                required
                className="flex-1 h-10 py-3 sm:py-0 px-3 rounded-lg border border-border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
              <button
                type="submit"
                className="h-10 px-4 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors whitespace-nowrap"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="py-6 border-t border-border/30">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <p className="text-sm text-muted-foreground">
                © 2025 OppSkills. All rights reserved.
              </p>
              <Badge variant="secondary" className="text-xs px-2 py-1 hidden">
                Made with ❤️ for developers
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
