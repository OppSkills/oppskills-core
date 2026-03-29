import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';
import { Header } from './_components/Header';
import { Footer } from './_components/Footer';

export interface EventPassEmailProps {
  firstName?: string;
  email: string;
  participantName: string;
  participantCollege: string;
  participantImage?: string;
  eventName: string;
  eventDate: string;
  eventTime: string;
  ticketId: string;
  eventSlug?: string;
  passUrl?: string;
  passId?: string; // Event pass ID for authenticated route
  token?: string; // Token for QR code in OG image
  baseUrl?: string;
}

export function EventPassEmail({
  firstName,
  email,
  participantName,
  participantCollege,
  participantImage,
  eventName,
  eventDate,
  eventTime,
  ticketId,
  eventSlug,
  passUrl,
  passId,
  token,
  baseUrl = 'https://oppskills.com',
}: EventPassEmailProps) {
  const previewText = `Your event pass for ${eventName} is ready!`;

  const formatIST = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      
      return new Intl.DateTimeFormat('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }).format(date);
    } catch {
      return dateStr;
    }
  };

  const formatDateIST = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;

      return new Intl.DateTimeFormat('en-IN', {
        timeZone: 'Asia/Kolkata',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(date);
    } catch {
      return dateStr;
    }
  };

  // Construct the OG image URL with all parameters
  const ogImageParams = new URLSearchParams({
    name: participantName || 'Participant Name',
    college: participantCollege || 'College Name',
    email: email || 'email@example.com',
    eventName: eventName || 'Event Name',
    eventDate: eventDate || 'January 1, 2026',
    eventTime: eventTime || '10:00 AM onwards',
    ticketId: ticketId || '№ 000000',
  });

  // Add token for QR code generation if available
  if (token) {
    ogImageParams.set('token', token);
  }

  if (participantImage) {
    ogImageParams.set('image', participantImage);
  }

  const ogImageUrl = `${baseUrl}/api/og/event-pass?${ogImageParams.toString()}`;
  
  // Construct the pass URL - use provided passUrl, or passId for authenticated route, or fallback to eventSlug
  const viewPassUrl = passUrl || (passId ? `${baseUrl}/event-pass?passId=${passId}` : (eventSlug ? `${baseUrl}/event-pass?event=${eventSlug}&ticket=${ticketId}` : `${baseUrl}/event-pass`));

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Header baseUrl={baseUrl} />

          {/* Content */}
          <Section style={contentSection}>
            <Heading style={heading}>Hi {firstName || participantName}</Heading>
            <Heading style={subHeading}>Your Event Pass is Ready! 🎫</Heading>

            <Text style={paragraph}>
              Congratulations! Your registration for <strong>{eventName}</strong> has been confirmed. 
              Your personalized event pass is ready below.
            </Text>

            {/* Event Pass OG Image */}
            <Section style={passImageSection}>
              <Link href={viewPassUrl}>
                <Img
                  src={ogImageUrl}
                  alt={`Event Pass for ${eventName}`}
                  width="600"
                  height="300"
                  style={passImage}
                />
              </Link>
            </Section>

            {/* Event Details Card */}
            <Section style={detailsCard}>
              <Text style={detailsTitle}>Event Details</Text>
              <Text style={detailsItem}>
                <strong>Event:</strong> {eventName}
              </Text>
              <Text style={detailsItem}>
                <strong>Date:</strong> {formatDateIST(eventDate)}
              </Text>
              <Text style={detailsItem}>
                <strong>Time:</strong> {formatIST(eventTime)}
              </Text>
              <Text style={detailsItem}>
                <strong>Ticket ID:</strong> {ticketId}
              </Text>
            </Section>

            <Text style={paragraph}>
              <strong>Important Reminders:</strong>
            </Text>
            <Section style={listSection}>
              <Text style={listItem}>
                • Save or screenshot your pass for offline access
              </Text>
              <Text style={listItem}>
                • Arrive 15 minutes before the start time
              </Text>
              <Text style={listItem}>
                • Have your Ticket ID ready for verification
              </Text>
              <Text style={listItem}>
                • Show your pass at the venue entrance
              </Text>
            </Section>

            <Section style={ctaSection}>
              <Link href={viewPassUrl} style={ctaButton}>
                View Your Pass ↗
              </Link>
            </Section>

            <Text style={noteText}>
              <strong>Note:</strong> If the image above doesn't load, click the button to view your pass online.
            </Text>
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

const passImageSection: React.CSSProperties = {
  margin: '32px 0',
  textAlign: 'center' as const,
};

const passImage: React.CSSProperties = {
  width: '100%',
  maxWidth: '600px',
  height: 'auto',
  borderRadius: '12px',
  border: '2px solid #e5e7eb',
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
};

const detailsCard: React.CSSProperties = {
  backgroundColor: '#f9fafb',
  borderRadius: '8px',
  padding: '20px',
  margin: '24px 0',
  border: '1px solid #f3f4f6',
};

const detailsTitle: React.CSSProperties = {
  fontSize: '14px',
  fontWeight: '600',
  color: '#6b7280',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
  margin: '0 0 12px',
};

const detailsItem: React.CSSProperties = {
  fontSize: '15px',
  lineHeight: '22px',
  color: '#111827',
  margin: '0 0 8px',
};

const listSection: React.CSSProperties = {
  margin: '0 0 24px',
};

const listItem: React.CSSProperties = {
  fontSize: '15px',
  lineHeight: '28px',
  color: '#4b5563',
  margin: '0 0 4px',
};

const ctaSection: React.CSSProperties = {
  marginTop: '32px',
  textAlign: 'center' as const,
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

const noteText: React.CSSProperties = {
  fontSize: '14px',
  lineHeight: '20px',
  color: '#6b7280',
  margin: '24px 0 0',
  fontStyle: 'italic',
};

