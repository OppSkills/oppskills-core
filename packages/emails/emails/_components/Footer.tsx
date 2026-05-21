import { Hr, Link, Section, Text } from "@react-email/components";
import * as React from "react";

export function Footer() {
  return (
    <Section style={footerSection}>
      <Text style={footerText}>
        Questions? Reach out to us at{" "}
        <Link href="mailto:info@oppskills.com" style={footerLink}>
          info@oppskills.com
        </Link>
      </Text>
      <Text style={footerText}>
        Warm regards,
        <br />
        Team OppSkills
      </Text>

      <Hr style={footerHr} />

      {/* Physical Address - Required for Spam Compliance */}
      <Text style={addressText}>
        OppSkills Global • Greater Noida, Uttar Pradesh, 201310
      </Text>

      <Text style={addressText}>
        You are receiving this because you signed up for OppSkills.{" "}
      </Text>
      <Text style={addressText}>
        This is an automated email. Please do not reply to this email.{" "}
      </Text>
      <Text style={addressText}>
        {Math.random().toString(36).substring(2, 9)}
      </Text>
    </Section>
  );
}

const footerSection: React.CSSProperties = {
  padding: "0 40px 40px",
};

const footerText: React.CSSProperties = {
  fontSize: "14px",
  lineHeight: "20px",
  color: "#6b7280",
  margin: "0 0 4px",
};

const footerLink: React.CSSProperties = {
  color: "#8c53dc",
  textDecoration: "none",
};

const footerHr: React.CSSProperties = {
  borderColor: "#e5e7eb",
  margin: "24px 0",
};

const addressText: React.CSSProperties = {
  fontSize: "12px",
  lineHeight: "18px",
  color: "#9ca3af",
  textAlign: "center" as const,
  margin: "0 0 8px",
};
