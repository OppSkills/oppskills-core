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

export interface CommunityWelcomeEmailProps {
  firstName?: string;
  communityName: string;
  communityHandle: string;
  baseUrl?: string;
}

export function CommunityWelcomeEmail({
  firstName,
  communityName,
  communityHandle,
  baseUrl = "https://www.oppskills.com",
}: CommunityWelcomeEmailProps) {
  const previewText = `Welcome to the ${communityName} community on OppSkills!`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Header baseUrl={baseUrl} />

          <Section style={contentSection}>
            <Heading style={heading}>Hi {firstName || "there"},</Heading>
            <Heading style={subHeading}>
              You've been added to {communityName}!
            </Heading>

            <Text style={paragraph}>
              We are excited to let you know that you have been added to the{" "}
              <strong>{communityName}</strong> community on OppSkills.
            </Text>

            <Text style={paragraph}>
              As a member of this community, you can stay updated on upcoming
              meets, access exclusive resources, and collaborate with other
              members.
            </Text>

            <Section style={ctaSection}>
              <Link
                href={`${baseUrl}/dashboard/community/manage`}
                style={ctaButton}
              >
                Go to Community ↗
              </Link>
            </Section>
          </Section>

          <Footer />
        </Container>
      </Body>
    </Html>
  );
}

export default CommunityWelcomeEmail;

const main: React.CSSProperties = {
  backgroundColor: "#f3f4f6",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
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
  fontSize: "20px",
  fontWeight: "600",
  color: "#374151",
  margin: "0 0 24px",
  lineHeight: "1.2",
};

const paragraph: React.CSSProperties = {
  fontSize: "16px",
  lineHeight: "24px",
  color: "#4b5563",
  margin: "0 0 20px",
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
