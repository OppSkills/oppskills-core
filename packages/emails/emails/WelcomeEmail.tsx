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
} from '@react-email/components';
import * as React from 'react';
import { Header } from './_components/Header';
import { Footer } from './_components/Footer';

export interface WelcomeEmailProps {
  firstName?: string;
  email: string;
}

export function WelcomeEmail({ firstName, email }: WelcomeEmailProps) {
  const previewText = `Welcome to OppSkills - Your journey to opportunities starts here!`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Header />

          {/* Content */}
          <Section style={contentSection}>
            <Heading style={heading}>Hi {firstName || 'Consumer'}</Heading>
            <Heading style={subHeading}>Welcome To OppSkills</Heading>

            <Text style={paragraph}>
              We're excited to have you join a growing community of learners, creators, and problem-solvers who are actively exploring real opportunities to build their skills.
            </Text>

            <Text style={paragraph}>
              At Oppskills, we understand how overwhelming it can be to find the right competitions, challenges, and learning experiences. That's why we're building a space that brings meaningful opportunities together—so you can focus less on searching and more on growing.
            </Text>

            <Text style={paragraph}>
              Thank you for taking the first step with us. We're glad to be a part of your journey.
            </Text>

            <Section style={ctaSection}>
              <Link href="https://oppskills.com/dashboard" style={ctaButton}>
                Explore OppSkills ↗
              </Link>
            </Section>
          </Section>

          <Footer />
        </Container>
      </Body>
    </Html>
  );
}

export default WelcomeEmail;

const main: React.CSSProperties = {
  backgroundColor: '#f3f4f6',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif',
  padding: '40px 0',
};

const container: React.CSSProperties = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  maxWidth: '600px',
  borderRadius: '12px',
  overflow: 'hidden',
  border: '1px solid #e5e7eb',
};

const contentSection: React.CSSProperties = {
  padding: '0 40px 40px',
};

const heading: React.CSSProperties = {
  fontSize: '24px',
  fontWeight: '700',
  color: '#111827',
  margin: '0 0 8px',
  lineHeight: '1.2',
};

const subHeading: React.CSSProperties = {
  fontSize: '24px',
  fontWeight: '700',
  color: '#111827',
  margin: '0 0 24px',
  lineHeight: '1.2',
};

const paragraph: React.CSSProperties = {
  fontSize: '16px',
  lineHeight: '24px',
  color: '#4b5563',
  margin: '0 0 20px',
};

const ctaSection: React.CSSProperties = {
  marginTop: '32px',
};

const ctaButton: React.CSSProperties = {
  backgroundColor: '#8c53dc',
  borderRadius: '9999px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 32px',
};
