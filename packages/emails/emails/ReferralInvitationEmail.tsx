import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";
import { Header } from "./_components/Header";
import { Footer } from "./_components/Footer";

export interface ReferralInvitationEmailProps {
  firstName?: string;
  entityName: string;
  entityType: "hackathon" | "event" | "festival";
  organizerName: string;
  referralLink: string;
  baseUrl?: string;
}

export function ReferralInvitationEmail({
  firstName,
  entityName,
  entityType,
  organizerName,
  referralLink,
  baseUrl = "https://www.oppskills.com",
}: ReferralInvitationEmailProps) {
  const previewText = `You have been added as a referral for ${entityName}`;
  const userName = firstName?.trim() || "there";

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Header baseUrl={baseUrl} />
          <Section style={contentSection}>
            <Heading style={heading}>Hi {userName},</Heading>
            <Text style={paragraph}>
              {organizerName} added you as a referral partner for the{" "}
              {entityType} <strong>{entityName}</strong>.
            </Text>
            <Text style={paragraph}>
              Share your unique referral link. Registrations from this link will
              be counted under your profile.
            </Text>
            <Section style={buttonSection}>
              <Button style={button} href={referralLink}>
                Open Referral Link
              </Button>
            </Section>
            <Text style={footNote}>{referralLink}</Text>
          </Section>
          <Footer />
        </Container>
      </Body>
    </Html>
  );
}

export default ReferralInvitationEmail;

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
  margin: "0 0 16px",
  lineHeight: "1.2",
};

const paragraph: React.CSSProperties = {
  fontSize: "16px",
  lineHeight: "24px",
  color: "#4b5563",
  margin: "0 0 16px",
};

const buttonSection: React.CSSProperties = {
  margin: "24px 0",
};

const button: React.CSSProperties = {
  backgroundColor: "#4c3e73",
  color: "#ffffff",
  padding: "12px 20px",
  borderRadius: "8px",
  textDecoration: "none",
  fontWeight: "600",
};

const footNote: React.CSSProperties = {
  fontSize: "13px",
  lineHeight: "20px",
  color: "#6b7280",
  wordBreak: "break-word",
};
