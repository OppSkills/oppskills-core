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

export interface CommunityTaskAssignedEmailProps {
  assigneeName?: string;
  assignerName: string;
  communityName: string;
  taskTitle: string;
  taskDescription?: string;
  dueDate?: string;
  baseUrl?: string;
}

export function CommunityTaskAssignedEmail({
  assigneeName,
  assignerName,
  communityName,
  taskTitle,
  taskDescription,
  dueDate,
  baseUrl = "https://www.oppskills.com",
}: CommunityTaskAssignedEmailProps) {
  const previewText = `New task assigned in ${communityName}: ${taskTitle}`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Header baseUrl={baseUrl} />
          <Section style={contentSection}>
            <Heading style={heading}>Hi {assigneeName || "there"},</Heading>
            <Heading style={subHeading}>
              A task has been assigned to you!
            </Heading>
            <Text style={paragraph}>
              <strong>{assignerName}</strong> has assigned a new task to you in
              the <strong>{communityName}</strong> community.
            </Text>
            <Section style={taskCard}>
              <Text style={taskTitleText}>
                <strong>Task</strong>: {taskTitle}
              </Text>
              {taskDescription && (
                <Text style={taskDescText}>
                  <strong>Description</strong>: {taskDescription}
                </Text>
              )}
              {dueDate && (
                <Text style={taskDateText}>
                  📅 <strong>Due Date</strong>: {dueDate}
                </Text>
              )}
            </Section>
            <Section style={ctaSection}>
              <Link href={`${baseUrl}/dashboard/community`} style={ctaButton}>
                View Task on Dashboard ↗
              </Link>
            </Section>
          </Section>
          <Footer />
        </Container>
      </Body>
    </Html>
  );
}

export default CommunityTaskAssignedEmail;

const main: React.CSSProperties = {
  backgroundColor: "#f3f4f6",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
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
  fontSize: "22px",
  fontWeight: "700",
  color: "#111827",
  margin: "0 0 8px",
};
const subHeading: React.CSSProperties = {
  fontSize: "18px",
  fontWeight: "600",
  color: "#374151",
  margin: "0 0 20px",
};
const paragraph: React.CSSProperties = {
  fontSize: "16px",
  lineHeight: "24px",
  color: "#4b5563",
  margin: "0 0 20px",
};
const taskCard: React.CSSProperties = {
  backgroundColor: "#f9fafb",
  border: "1px solid #e5e7eb",
  borderRadius: "8px",
  padding: "16px",
  margin: "20px 0",
};
const taskTitleText: React.CSSProperties = {
  fontSize: "16px",
  color: "#111827",
  margin: "0 0 8px",
};
const taskDescText: React.CSSProperties = {
  fontSize: "14px",
  color: "#4b5563",
  margin: "0 0 8px",
};
const taskDateText: React.CSSProperties = {
  fontSize: "14px",
  color: "#6b7280",
  margin: "0",
};
const ctaSection: React.CSSProperties = {
  marginTop: "24px",
};
const ctaButton: React.CSSProperties = {
  backgroundColor: "#8c53dc",
  borderRadius: "9999px",
  color: "#ffffff",
  fontSize: "15px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center",
  display: "inline-block",
  padding: "12px 28px",
};
