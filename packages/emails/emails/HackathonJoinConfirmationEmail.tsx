import {
  Body,
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

export interface HackathonJoinConfirmationEmailProps {
  userName: string;
  hackathonName: string;
  teamName: string;
  baseUrl?: string;
}

export function HackathonJoinConfirmationEmail({
  userName,
  hackathonName,
  teamName,
  baseUrl = "https://www.oppskills.com",
}: HackathonJoinConfirmationEmailProps) {
  const previewText = `You joined ${hackathonName}`;

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
              You have successfully joined the hackathon{" "}
              <strong>{hackathonName}</strong>.
            </Text>
            <Text style={paragraph}>
              Team: <strong>{teamName}</strong>
            </Text>
            <Text style={paragraph}>
              We are excited to have you onboard. Best of luck!
            </Text>
          </Section>
          <Footer />
        </Container>
      </Body>
    </Html>
  );
}

export default HackathonJoinConfirmationEmail;

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
