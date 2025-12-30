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
} from '@react-email/components';
import * as React from 'react';
import { Header } from './_components/Header';
import { Footer } from './_components/Footer';

export interface EventPassEmailProps {
  firstName?: string;
  email: string;
  eventName: string;
  eventDate: string;
  eventTime?: string;
  eventLocation?: string;
  eventType?: string;
  registrationId: string;
  eventSlug: string;
}

export function EventPassEmail({
  firstName,
  email,
  eventName,
  eventDate,
  eventTime,
  eventLocation,
  eventType,
  registrationId,
  eventSlug,
}: EventPassEmailProps) {
  const previewText = `Your Event Pass for ${eventName} - Registration Confirmed!`;

  const getEventTypeLabel = (type?: string) => {
    switch (type) {
      case 'WORKSHOP':
        return 'Workshop';
      case 'CONFERENCE':
        return 'Conference';
      case 'MEETUP':
        return 'Meetup';
      case 'NETWORKING':
        return 'Networking';
      case 'SEMINAR':
        return 'Seminar';
      case 'WEBINAR':
        return 'Webinar';
      default:
        return 'Event';
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
            <Heading style={heading}>Hi {firstName || 'Guest'}</Heading>
            <Heading style={subHeading}>Registration Confirmed!</Heading>
            
            <Text style={paragraph}>
              Your registration for <strong>{eventName}</strong> is successful. Here is your event pass. Please keep this email handy for check-in.
            </Text>

            {/* Event Pass Card */}
            <Section style={passCard}>
              <Section style={passHeader}>
                <Row>
                  <Column>
                    <Text style={passTicketLabel}>EVENT PASS</Text>
                  </Column>
                  <Column align="right">
                    <Text style={passTypeLabel}>{getEventTypeLabel(eventType).toUpperCase()}</Text>
                  </Column>
                </Row>
              </Section>
              
              <Section style={passBody}>
                <Heading style={passEventName}>{eventName}</Heading>
                
                <Row style={passDetailRow}>
                  <Column style={passDetailCol}>
                    <Text style={passDetailLabel}>DATE</Text>
                    <Text style={passDetailValue}>{eventDate}</Text>
                  </Column>
                  {eventTime && (
                    <Column style={passDetailCol}>
                      <Text style={passDetailLabel}>TIME</Text>
                      <Text style={passDetailValue}>{eventTime}</Text>
                    </Column>
                  )}
                </Row>

                <Row style={passDetailRow}>
                  <Column>
                    <Text style={passDetailLabel}>LOCATION</Text>
                    <Text style={passDetailValue}>{eventLocation || 'Check event details'}</Text>
                  </Column>
                </Row>

                <Section style={registrationIdSection}>
                  <Text style={passDetailLabel}>REGISTRATION ID</Text>
                  <Text style={registrationIdValue}>{registrationId}</Text>
                </Section>
              </Section>
              
              <Section style={passFooter}>
                <Text style={passFooterText}>Present this pass at the entrance</Text>
              </Section>
            </Section>

            <Text style={paragraph}>
              <strong>Important Reminders:</strong>
            </Text>
            <Section style={listSection}>
              <Text style={listItem}>• Save or screenshot this email for offline access.</Text>
              <Text style={listItem}>• Arrive 15 minutes before the start time.</Text>
              <Text style={listItem}>• Have your Registration ID ready for verification.</Text>
            </Section>

            <Section style={ctaSection}>
              <Link
                href={`https://oppskills.com/events/${eventSlug}`}
                style={ctaButton}
              >
                View Event Details ↗
              </Link>
            </Section>
          </Section>

          <Footer />
        </Container>
      </Body>
    </Html>
  );
}

export default EventPassEmail;

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
  color: '#8c53dc',
  margin: '0 0 24px',
  lineHeight: '1.2',
};

const paragraph: React.CSSProperties = {
  fontSize: '16px',
  lineHeight: '24px',
  color: '#4b5563',
  margin: '0 0 20px',
};

const passCard: React.CSSProperties = {
  backgroundColor: '#111827',
  borderRadius: '16px',
  overflow: 'hidden',
  margin: '32px 0',
  border: '1px solid #374151',
  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
};

const passHeader: React.CSSProperties = {
  backgroundColor: '#8c53dc',
  padding: '12px 24px',
};

const passTicketLabel: React.CSSProperties = {
  color: '#ffffff',
  fontSize: '12px',
  fontWeight: '800',
  letterSpacing: '0.1em',
  margin: '0',
};

const passTypeLabel: React.CSSProperties = {
  color: 'rgba(255, 255, 255, 0.8)',
  fontSize: '12px',
  fontWeight: '600',
  letterSpacing: '0.05em',
  margin: '0',
};

const passBody: React.CSSProperties = {
  padding: '32px 24px',
};

const passEventName: React.CSSProperties = {
  color: '#ffffff',
  fontSize: '28px',
  fontWeight: '800',
  margin: '0 0 32px',
  lineHeight: '1.1',
};

const passDetailRow: React.CSSProperties = {
  marginBottom: '24px',
};

const passDetailCol: React.CSSProperties = {
  width: '50%',
};

const passDetailLabel: React.CSSProperties = {
  color: '#9ca3af',
  fontSize: '10px',
  fontWeight: '700',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.1em',
  margin: '0 0 4px',
};

const passDetailValue: React.CSSProperties = {
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  margin: '0',
};

const registrationIdSection: React.CSSProperties = {
  marginTop: '32px',
  padding: '16px',
  backgroundColor: 'rgba(140, 83, 220, 0.1)',
  borderRadius: '8px',
  border: '1px dashed rgba(140, 83, 220, 0.3)',
  textAlign: 'center' as const,
};

const registrationIdValue: React.CSSProperties = {
  color: '#8c53dc',
  fontSize: '20px',
  fontWeight: '800',
  fontFamily: 'monospace',
  margin: '4px 0 0',
  letterSpacing: '0.05em',
};

const passFooter: React.CSSProperties = {
  padding: '12px 24px',
  backgroundColor: 'rgba(255, 255, 255, 0.05)',
  borderTop: '1px solid #374151',
  textAlign: 'center' as const,
};

const passFooterText: React.CSSProperties = {
  color: '#9ca3af',
  fontSize: '12px',
  fontWeight: '500',
  margin: '0',
};

const listSection: React.CSSProperties = {
  margin: '0 0 24px',
};

const listItem: React.CSSProperties = {
  fontSize: '15px',
  lineHeight: '24px',
  color: '#4b5563',
  margin: '0 0 8px',
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
