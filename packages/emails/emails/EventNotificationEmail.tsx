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

export interface EventNotificationEmailProps {
  firstName?: string;
  eventName: string;
  eventSlug: string;
  htmlBody: string;
  baseUrl?: string;
}

export function EventNotificationEmail({
  firstName,
  eventName,
  eventSlug,
  htmlBody,
  baseUrl = "https://www.oppskills.com",
}: EventNotificationEmailProps) {
  const previewText = `New update from ${eventName}`;
  const eventLink = `${baseUrl}/events/${eventSlug}`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Header baseUrl={baseUrl} />
          <Section style={contentSection}>
            <Heading style={heading}>Hi {firstName || "Participant"},</Heading>

            <Text style={introText}>
              You have a new update regarding{" "}
              <Link href={eventLink} style={link}>
                {eventName}
              </Link>
            </Text>

            <Section style={messageContainer}>
              <div
                style={messageBody}
                dangerouslySetInnerHTML={{ __html: htmlBody }}
              />
            </Section>

            <Section style={ctaSection}>
              <Link href={eventLink} style={ctaButton}>
                View Event
              </Link>
            </Section>
          </Section>

          <Footer />
        </Container>
      </Body>
    </Html>
  );
}

export default EventNotificationEmail;

const main = {
  backgroundColor: "#f3f4f6",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif',
  padding: "40px 0",
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  maxWidth: "600px",
  borderRadius: "12px",
  overflow: "hidden",
  border: "1px solid #e5e7eb",
};

const contentSection = {
  padding: "0 40px 40px",
};

const heading = {
  fontSize: "24px",
  fontWeight: "700",
  color: "#111827",
  margin: "0 0 16px",
  lineHeight: "1.2",
};

const introText = {
  fontSize: "16px",
  lineHeight: "24px",
  color: "#4b5563",
  margin: "0 0 24px",
};

const link = {
  color: "#8c53dc",
  textDecoration: "none",
  fontWeight: "600",
};

const messageContainer = {
  backgroundColor: "#f9fafb",
  borderRadius: "8px",
  padding: "24px",
  marginBottom: "24px",
  border: "1px solid #f3f4f6",
};

const messageBody = {
  fontSize: "16px",
  lineHeight: "26px",
  color: "#111827",
  margin: "0",
};

const ctaSection = {
  marginTop: "32px",
  textAlign: "center" as const,
};

const ctaButton = {
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
