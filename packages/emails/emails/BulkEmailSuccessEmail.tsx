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

export interface BulkEmailSuccessEmailProps {
    firstName?: string;
    eventName: string;
    count: number;
}

export function BulkEmailSuccessEmail({
    firstName,
    eventName,
    count,
}: BulkEmailSuccessEmailProps) {
    const previewText = `Bulk email sent for ${eventName}`;

    return (
        <Html>
            <Head />
            <Preview>{previewText}</Preview>
            <Body style={main}>
                <Container style={container}>
                    <Header />
                    <Section style={contentSection}>
                        <Heading style={heading}>Hi {firstName || "Organizer"},</Heading>

                        <Text style={introText}>
                            Your bulk email task for <strong>{eventName}</strong> has been successfully finished.
                        </Text>

                        <Section style={messageContainer}>
                            <Text style={messageText}>
                                The email has been successfully sent to <strong>{count}</strong> users.
                            </Text>
                        </Section>
                    </Section>

                    <Footer />
                </Container>
            </Body>
        </Html>
    );
}

export default BulkEmailSuccessEmail;

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

const messageContainer = {
    backgroundColor: "#ecfdf5", // Light green background for success
    borderRadius: "8px",
    padding: "24px",
    marginBottom: "24px",
    border: "1px solid #d1fae5",
};

const messageText = {
    fontSize: "18px",
    lineHeight: "26px",
    color: "#065f46", // Dark green text
    margin: "0",
    textAlign: "center" as const,
};
