import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";
import { Header } from "./_components/Header";
import { Footer } from "./_components/Footer";

export interface OnboardingCompleteEmailProps {
  firstName?: string;
  email: string;
  userCategory?: string;
  locationCity?: string;
  baseUrl?: string;
}

export function OnboardingCompleteEmail({
  firstName,
  email,
  userCategory,
  locationCity,
  baseUrl = "https://oppskills.com",
}: OnboardingCompleteEmailProps) {
  const previewText = `Your OppSkills profile is complete - Start exploring opportunities!`;

  const getCategoryLabel = (category?: string) => {
    switch (category) {
      case "SCHOOL_STUDENT":
        return "School Student";
      case "COLLEGE_STUDENT":
        return "College Student";
      case "WORKING_PROFESSIONAL":
        return "Working Professional";
      case "FRESHER":
        return "Fresher";
      case "PROFESSIONAL_SCHOOL_STUDENT":
        return "Professional School Student";
      default:
        return "Member";
    }
  };

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Header baseUrl={baseUrl} />

          {/* Content */}
          <Section style={contentSection}>
            <Heading style={heading}>Hi {firstName || "there"}</Heading>
            <Heading style={subHeading}>Profile Complete!</Heading>

            <Text style={paragraph}>
              Congratulations! You've successfully completed your OppSkills
              profile. You're now all set to explore and participate in
              opportunities that match your interests.
            </Text>

            <Section style={profileCard}>
              <Text style={profileTitle}>Your Profile Summary</Text>
              <Text style={profileItem}>
                <strong>Category:</strong> {getCategoryLabel(userCategory)}
              </Text>
              {locationCity && (
                <Text style={profileItem}>
                  <strong>Location:</strong> {locationCity}
                </Text>
              )}
            </Section>

            <Text style={paragraph}>Here's what you can do next:</Text>
            <Section style={listSection}>
              <Text style={listItem}>
                🎯 Browse hackathons tailored for you
              </Text>
              <Text style={listItem}>📅 Register for upcoming events</Text>
              <Text style={listItem}>👥 Find teams with your skills</Text>
            </Section>

            <Section style={ctaSection}>
              <Link href={`${baseUrl}/dashboard`} style={ctaButton}>
                Go to Dashboard ↗
              </Link>
            </Section>
          </Section>

          <Footer />
        </Container>
      </Body>
    </Html>
  );
}

export default OnboardingCompleteEmail;

const main: React.CSSProperties = {
  backgroundColor: "#f3f4f6",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif',
  padding: "40px 0",
};

const container: React.CSSProperties = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  maxWidth: "600px",
  borderRadius: "12px",
  overflow: "hidden",
  border: "1px solid #e5e7eb",
};

const contentSection: React.CSSProperties = {
  padding: "0 40px 40px",
};

const heading: React.CSSProperties = {
  fontSize: "24px",
  fontWeight: "700",
  color: "#111827",
  margin: "0 0 8px",
  lineHeight: "1.2",
};

const subHeading: React.CSSProperties = {
  fontSize: "24px",
  fontWeight: "700",
  color: "#8c53dc",
  margin: "0 0 24px",
  lineHeight: "1.2",
};

const paragraph: React.CSSProperties = {
  fontSize: "16px",
  lineHeight: "24px",
  color: "#4b5563",
  margin: "0 0 20px",
};

const profileCard: React.CSSProperties = {
  backgroundColor: "#f9fafb",
  borderRadius: "8px",
  padding: "20px",
  margin: "24px 0",
  border: "1px solid #f3f4f6",
};

const profileTitle: React.CSSProperties = {
  fontSize: "14px",
  fontWeight: "600",
  color: "#6b7280",
  textTransform: "uppercase" as const,
  letterSpacing: "0.05em",
  margin: "0 0 12px",
};

const profileItem: React.CSSProperties = {
  fontSize: "15px",
  lineHeight: "22px",
  color: "#111827",
  margin: "0 0 8px",
};

const listSection: React.CSSProperties = {
  margin: "0 0 24px",
};

const listItem: React.CSSProperties = {
  fontSize: "15px",
  lineHeight: "28px",
  color: "#4b5563",
  margin: "0 0 4px",
};

const ctaSection: React.CSSProperties = {
  marginTop: "32px",
};

const ctaButton: React.CSSProperties = {
  backgroundColor: "#8c53dc",
  borderRadius: "9999px",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 32px",
};
