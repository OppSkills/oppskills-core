'use client';

import { useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { useQuery } from '@tanstack/react-query';
import Image from 'next/image';
import { getEventPass } from '@/lib/api/eventApi';
import { format } from 'date-fns';
import { SITE_URL } from '@/lib/constants';
import '../event-pass.css';
import { Loader2 } from 'lucide-react';
import { StyledEventPassQr } from '@/app/event-pass/_components/StyledEventPassQr';

const EventPassPage = () => {
  const ticketRef = useRef<HTMLDivElement>(null);
  const { getToken, isLoaded } = useAuth();
  const searchParams = useSearchParams();
  const passId = searchParams.get('passId');

  // Fetch pass data
  const { data: passData, isLoading, error } = useQuery({
    queryKey: ['event-pass', passId],
    queryFn: async () => {
      if (!passId) throw new Error('Pass ID is required');
      const token = await getToken();
      if (!token) throw new Error('Authentication required');
      return getEventPass(token, passId);
    },
    enabled: isLoaded && !!passId,
  });

  useEffect(() => {
    const ticketElm = ticketRef.current;
    if (!ticketElm) return;

    const handleMouseMove = (e: MouseEvent) => {
      const { x, y, width, height } = ticketElm.getBoundingClientRect();
      const centerPoint = { x: x + width / 2, y: y + height / 2 };

      const degreeX = (e.clientY - centerPoint.y) * 0.006;
      const degreeY = (e.clientX - centerPoint.x) * -0.006;

      ticketElm.style.transform = `perspective(1000px) rotateX(${degreeX}deg) rotateY(${degreeY}deg)`;
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  // Loading state
  if (!isLoaded || isLoading) {
    return (
      <div className="event-pass-container">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  // Error state
  if (error || !passData) {
    return (
      <div className="event-pass-container">
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <h1 className="text-2xl font-bold text-foreground">
            {!passId ? 'Pass ID is required' : 'Event Pass Not Found'}
          </h1>
          <p className="text-muted-foreground">
            {error instanceof Error
              ? error.message
              : 'Unable to load event pass. Please check the URL and try again.'}
          </p>
        </div>
      </div>
    );
  }

  // Format event date
  const eventDate = format(new Date(passData.event.startDate), 'MMMM dd, yyyy');
  const eventTime = format(new Date(passData.event.startDate), 'hh:mm a') + ' onwards';

  const validationUrl = `${SITE_URL}/pass/validate/${passData.token}`;

  return (
    <div className="event-pass-container">
      <div className="ticket-visual_visual" id="ticket" ref={ticketRef}>
        <div className="left"></div>
        <div className="right"></div>
        <div className="ticket-visual-wrapper">
          {/* Vertical dashed line separator */}
          <div className="vertical-separator"></div>

          <div className="ticket-content">
            {/* Left Section */}
            <div className="ticket-left">
              {/* Top: Attendee Details */}
              <div className="attendee-section-left">
                <Image
                  src={passData.user.imageUrl || 'https://img.clerk.com/eyJ0eXBlIjoicHJveHkiLCJzcmMiOiJodHRwczovL2ltYWdlcy5jbGVyay5kZXYvb2F1dGhfZ29vZ2xlL2ltZ18zN25NdW5WSm1qZXQ2Yk1xNEtqNVJiWGVIQzkifQ?width=160'}
                  alt="Attendee"
                  width={100}
                  height={100}
                  className="attendee-image-left"
                  unoptimized
                />
                <div className="attendee-info-left">
                  <p className="attendee-name">
                    {`${passData.user.firstName} ${passData.user.lastName}`.trim() || 'Participant Name'}
                  </p>
                  <p className="attendee-college">{passData.user.collegeName || 'College Name'}</p>
                  <p className="attendee-email">{passData.user.email}</p>
                </div>
              </div>

              {/* Bottom: Event Info Row */}
              <div className="event-row">
                <div className="event-name-section">
                  <h1 className="event-name">{passData.event.name}</h1>
                </div>
                <div className="event-datetime">
                  <p className="event-date">{eventDate}</p>
                  <p className="event-time">{eventTime}</p>
                </div>
              </div>

              {/* Presented By */}
              <div className="presented-by">
                <span className="presented-text">Presented by</span>
                <Image
                  src="/logo.svg"
                  alt="OppSkills"
                  width={72}
                  height={18}
                  className="oppskills-logo"
                />
              </div>
            </div>

            {/* Right Section */}
            <div className="ticket-right">
              <div className="ticket-right-content">
                <div className="qr-code-vertical">
                  <StyledEventPassQr
                    validationUrl={validationUrl}
                    className="qr-code-svg"
                  />
                </div>
                <span className="ticket-id-vertical">{passData.ticketId}</span>

              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventPassPage;
