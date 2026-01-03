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

export interface ParticipantDirectMessageProps {
  firstName?: string;
  eventName: string;
  eventSlug: string;
  body: string;
  email: string;
}

export function ParticipantDirectMessage({
  firstName,
  eventName,
  eventSlug,
  body,
}: ParticipantDirectMessageProps) {
  const previewText = `Message from ${eventName} Organizer`;
  const eventLink = `https://www.oppskills.com/event/${eventSlug}`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Header />
          <Section style={contentSection}>
            <Heading style={heading}>Hi {firstName || "Participant"},</Heading>

            <Text style={subText}>
              You have a new message from the organizer of{' '}
              <Link href={eventLink} style={link}>
                {eventName}
              </Link>
              :
            </Text>

            <Section style={messageContainer}>
              <Text style={messageText}>
                {/* Preserving whitespace for simple text formatting if needed, though HTML usually collapses it. 
                     Assuming body is plain text. If it is HTML, we might need a parser, but usually plain text is safer here. */}
                {body}
              </Text>
            </Section>

            <Text style={footerNote}>
              You can reply to this email to contact the organizer directly.
            </Text>
          </Section>

          <Footer />
        </Container>
      </Body>
    </Html>
  );
}

export default ParticipantDirectMessage;

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

const subText = {
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

const messageText = {
  fontSize: "16px",
  lineHeight: "26px",
  color: "#111827",
  margin: "0",
  whiteSpace: "pre-wrap" as const, // Preserves newlines from the body text
};

const footerNote = {
  fontSize: "14px",
  color: "#6b7280",
  margin: "0",
  fontStyle: "italic",
};
