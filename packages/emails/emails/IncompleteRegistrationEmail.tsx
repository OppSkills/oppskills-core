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
  Row,
  Column,
} from "@react-email/components";
import * as React from "react";
import { Header } from "./_components/Header";
import { Footer } from "./_components/Footer";

export interface IncompleteRegistrationEmailProps {
  firstName?: string;
  email: string;
  eventName: string;
  eventDate: string;
  eventTime?: string;
  eventLocation?: string;
  eventType?: string;
  eventSlug: string;
}

export function IncompleteRegistrationEmail({
  firstName,
  email,
  eventName,
  eventDate,
  eventTime,
  eventLocation,
  eventType,
  eventSlug,
}: IncompleteRegistrationEmailProps) {
  const previewText = `Action Required: Complete your registration for ${eventName}`;

  const getEventTypeLabel = (type?: string) => {
    switch (type) {
      case "WORKSHOP":
        return "Workshop";
      case "CONFERENCE":
        return "Conference";
      case "MEETUP":
        return "Meetup";
      case "NETWORKING":
        return "Networking";
      case "SEMINAR":
        return "Seminar";
      case "WEBINAR":
        return "Webinar";
      default:
        return "Event";
    }
  };

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Header />

          {/* Content */}
          <Section style={contentSection}>
            <Heading style={heading}>Hi {firstName || "there"} 👋</Heading>
            <Heading style={subHeading}>Your Registration is Almost Complete!</Heading>

            <Text style={paragraph}>
              Great news! Your <strong>payment for {eventName}</strong> was successful. 
              However, we noticed that your registration form wasn't fully submitted.
            </Text>

            {/* Alert Box */}
            <Section style={alertBox}>
              <Text style={alertTitle}>⚠️ Action Required</Text>
              <Text style={alertText}>
                Please complete your registration form to secure your spot. 
                <strong> No additional payment is needed</strong> – just fill out the form!
              </Text>
            </Section>

            {/* Event Details Card */}
            <Section style={eventCard}>
              <Section style={eventCardHeader}>
                <Row>
                  <Column>
                    <Text style={eventCardLabel}>EVENT DETAILS</Text>
                  </Column>
                  <Column align="right">
                    <Text style={eventTypeLabel}>
                      {getEventTypeLabel(eventType).toUpperCase()}
                    </Text>
                  </Column>
                </Row>
              </Section>

              <Section style={eventCardBody}>
                <Heading style={eventName_style}>{eventName}</Heading>

                <Row style={detailRow}>
                  <Column style={detailCol}>
                    <Text style={detailLabel}>DATE</Text>
                    <Text style={detailValue}>{eventDate}</Text>
                  </Column>
                  {eventTime && (
                    <Column style={detailCol}>
                      <Text style={detailLabel}>TIME</Text>
                      <Text style={detailValue}>{eventTime}</Text>
                    </Column>
                  )}
                </Row>

                <Row style={detailRow}>
                  <Column>
                    <Text style={detailLabel}>LOCATION</Text>
                    <Text style={detailValue}>
                      {eventLocation || "Check event details"}
                    </Text>
                  </Column>
                </Row>

                <Section style={statusSection}>
                  <Row>
                    <Column style={statusCol}>
                      <Text style={statusLabel}>PAYMENT</Text>
                      <Text style={statusComplete}>✓ Complete</Text>
                    </Column>
                    <Column style={statusCol}>
                      <Text style={statusLabel}>REGISTRATION FORM</Text>
                      <Text style={statusIncomplete}>⏳ Incomplete</Text>
                    </Column>
                  </Row>
                </Section>
              </Section>
            </Section>

            <Text style={paragraph}>
              Click the button below to complete your registration. It only takes a minute!
            </Text>

            <Section style={ctaSection}>
              <Link
                href={`https://oppskills.com/events/${eventSlug}`}
                style={ctaButton}
              >
                Complete Registration Now →
              </Link>
            </Section>

            <Text style={smallText}>
              If you have any questions, feel free to reach out to us at{" "}
              <Link href="mailto:support@oppskills.com" style={linkStyle}>
                support@oppskills.com
              </Link>
            </Text>
          </Section>

          <Footer />
        </Container>
      </Body>
    </Html>
  );
}

export default IncompleteRegistrationEmail;

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
  margin: "0 0 8px",
  lineHeight: "1.2",
};

const subHeading = {
  fontSize: "22px",
  fontWeight: "700",
  color: "#f59e0b",
  margin: "0 0 24px",
  lineHeight: "1.2",
};

const paragraph = {
  fontSize: "16px",
  lineHeight: "24px",
  color: "#4b5563",
  margin: "0 0 20px",
};

const alertBox = {
  backgroundColor: "#fef3c7",
  borderRadius: "12px",
  padding: "20px 24px",
  margin: "24px 0",
  border: "1px solid #fcd34d",
};

const alertTitle = {
  fontSize: "16px",
  fontWeight: "700",
  color: "#92400e",
  margin: "0 0 8px",
};

const alertText = {
  fontSize: "14px",
  lineHeight: "22px",
  color: "#78350f",
  margin: "0",
};

const eventCard = {
  backgroundColor: "#111827",
  borderRadius: "16px",
  overflow: "hidden",
  margin: "32px 0",
  border: "1px solid #374151",
  boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
};

const eventCardHeader = {
  backgroundColor: "#8c53dc",
  padding: "12px 24px",
};

const eventCardLabel = {
  color: "#ffffff",
  fontSize: "12px",
  fontWeight: "800",
  letterSpacing: "0.1em",
  margin: "0",
};

const eventTypeLabel = {
  color: "rgba(255, 255, 255, 0.8)",
  fontSize: "12px",
  fontWeight: "600",
  letterSpacing: "0.05em",
  margin: "0",
};

const eventCardBody = {
  padding: "32px 24px",
};

const eventName_style = {
  color: "#ffffff",
  fontSize: "24px",
  fontWeight: "800",
  margin: "0 0 24px",
  lineHeight: "1.2",
};

const detailRow = {
  marginBottom: "20px",
};

const detailCol = {
  width: "50%",
};

const detailLabel = {
  color: "#9ca3af",
  fontSize: "10px",
  fontWeight: "700",
  textTransform: "uppercase" as const,
  letterSpacing: "0.1em",
  margin: "0 0 4px",
};

const detailValue = {
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "600",
  margin: "0",
};

const statusSection = {
  marginTop: "24px",
  padding: "16px",
  backgroundColor: "rgba(255, 255, 255, 0.05)",
  borderRadius: "8px",
  border: "1px solid #374151",
};

const statusCol = {
  width: "50%",
  textAlign: "center" as const,
};

const statusLabel = {
  color: "#9ca3af",
  fontSize: "10px",
  fontWeight: "700",
  textTransform: "uppercase" as const,
  letterSpacing: "0.1em",
  margin: "0 0 8px",
};

const statusComplete = {
  color: "#10b981",
  fontSize: "14px",
  fontWeight: "700",
  margin: "0",
};

const statusIncomplete = {
  color: "#f59e0b",
  fontSize: "14px",
  fontWeight: "700",
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
  padding: "14px 40px",
};

const smallText = {
  fontSize: "14px",
  lineHeight: "20px",
  color: "#6b7280",
  margin: "24px 0 0",
  textAlign: "center" as const,
};

const linkStyle = {
  color: "#8c53dc",
  textDecoration: "underline",
};

