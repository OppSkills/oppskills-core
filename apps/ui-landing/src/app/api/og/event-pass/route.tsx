import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

async function loadImageAsData(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      return url; // Fallback to URL if fetch fails
    }
    const arrayBuffer = await response.arrayBuffer();
    // Convert ArrayBuffer to base64 in edge runtime
    const bytes = new Uint8Array(arrayBuffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]!);
    }
    const base64 = btoa(binary);
    const contentType = response.headers.get('content-type') || 'image/png';
    return `data:${contentType};base64,${base64}`;
  } catch {
    return url; // Fallback to URL if error
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Extract participant details from URL params
    const participantName = searchParams.get('name') || 'Participant Name';
    const participantCollege = searchParams.get('college') || 'College Name';
    const participantEmail = searchParams.get('email') || 'email@example.com';
    const participantImageUrl =
      searchParams.get('image') ||
      'https://img.clerk.com/eyJ0eXBlIjoicHJveHkiLCJzcmMiOiJodHRwczovL2ltYWdlcy5jbGVyay5kZXYvb2F1dGhfZ29vZ2xlL2ltZ18zN25NdW5WSm1qZXQ2Yk1xNEtqNVJiWGVIQzkifQ?width=160';

    // Extract event details from URL params
    const eventName = searchParams.get('eventName') || 'Event Name';
    const eventDate = searchParams.get('eventDate') || 'January 1, 2026';
    const eventTime = searchParams.get('eventTime') || '10:00 AM onwards';
    const ticketId = searchParams.get('ticketId') || '№ 000000';
    const token = searchParams.get('token') || '';

    // Get base URL for local assets
    const baseUrl = request.nextUrl.origin;

    // Generate QR code data URL if token is provided
    let qrCodeDataUrl = '';
    if (token) {
      // Use a QR code API service for Edge runtime compatibility
      // Format: https://api.qrserver.com/v1/create-qr-code/?size=300x300&data={token}
      const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(token)}&ecc=H`;
      qrCodeDataUrl = await loadImageAsData(qrCodeUrl);
    } else {
      // Fallback to barcode if no token
      qrCodeDataUrl = await loadImageAsData(`${baseUrl}/barcode.jpeg`);
    }

    // Preload images for better performance in edge runtime
    const [participantImage, logoImage] = await Promise.all([
      loadImageAsData(participantImageUrl),
      loadImageAsData(`${baseUrl}/logo.png`),
    ]);

    // OG images are typically 1200x630, but we'll match the ticket aspect ratio
    // Ticket is 720x320, so we'll scale it up proportionally
    const width = 960;
    const height = 400;

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#0a0a0f',
            position: 'relative',
            padding: '30px',
          }}
        >
          {/* Golden gradient border effect */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(to right, #7A5C1E, #D4AF37, #FFF1A8, #D4AF37, #7A5C1E)',
              borderRadius: '20px',
              padding: '7px',
              display: 'flex',
            }}
          >
            {/* Outer left circle (gradient border) - positioned relative to golden border */}
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '-33px',
                transform: 'translateY(-50%)',
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: '#7A5C1E',
                zIndex: 2,
              }}
            />
            {/* Outer right circle (gradient border) - positioned relative to golden border */}
            <div
              style={{
                position: 'absolute',
                top: '42%',
                right: '-33px',
                transform: 'translateY(-50%)',
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: '#D4AF37',
                zIndex: 2,
              }}
            />
            {/* Left black rectangle to hide outer half - positioned relative to golden border */}
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '-50px',
                transform: 'translateY(-50%)',
                width: '50px',
                height: '100px',
                background: '#0a0a0f',
                zIndex: 4,
              }}
            />
            {/* Right black rectangle to hide outer half - positioned relative to golden border */}
            <div
              style={{
                position: 'absolute',
                top: '50%',
                right: '-50px',
                transform: 'translateY(-50%)',
                width: '50px',
                height: '100px',
                background: '#0a0a0f',
                zIndex: 4,
              }}
            />
            {/* Inner content */}
            <div
              style={{
                width: '100%',
                height: '100%',
                background: '#111116',
                borderRadius: '17px',
                display: 'flex',
                flexDirection: 'row',
                padding: '40px 50px',
                position: 'relative',
                zIndex: 5,
              }}
            >
              {/* Inner left circle (background) with golden border - positioned relative to inner content */}
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '-30px',
                  transform: 'translateY(-50%)',
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #7A5C1E, #D4AF37)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 6,
                }}
              >
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '50%',
                    background: '#0a0a0f',
                  }}
                />
              </div>
              {/* Inner right circle (background) with golden border - positioned relative to inner content */}
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  right: '-30px',
                  transform: 'translateY(-50%)',
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #7A5C1E, #D4AF37)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 6,
                }}
              >
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '50%',
                    background: '#0a0a0f',
                  }}
                />
              </div>
              {/* Left Section */}
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  paddingRight: '40px',
                }}
              >
                {/* Attendee Section */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: '25px',
                  }}
                >
                  {/* Profile Image */}
                  <img
                    src={participantImage}
                    alt="Attendee"
                    width={120}
                    height={120}
                    style={{
                      borderRadius: '50%',
                      border: '3px solid',
                      borderColor: '#D4AF37',
                      objectFit: 'cover',
                    }}
                  />
                  {/* Attendee Info */}
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '38px',
                        fontWeight: 700,
                        color: '#ffffff',
                        letterSpacing: '-0.5px',
                        lineHeight: '1.2',
                        display: 'block',
                      }}
                    >
                      {participantName}
                    </div>
                    <div
                      style={{
                        fontSize: '18px',
                        color: '#9ca3af',
                        fontWeight: 500,
                        letterSpacing: '0.2px',
                        display: 'block',
                      }}
                    >
                      {participantCollege}
                    </div>
                    <div
                      style={{
                        fontSize: '16px',
                        color: '#6b7280',
                        fontWeight: 400,
                        display: 'block',
                      }}
                    >
                      {participantEmail}
                    </div>
                  </div>
                </div>

                {/* Event Row */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: '30px',
                  }}
                >
                  <div
                    style={{
                      fontSize: '32px',
                      fontWeight: 700,
                      color: '#ffffff',
                      lineHeight: '1.2',
                      display: 'block',
                    }}
                  >
                    {eventName}
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '16px',
                        fontWeight: 600,
                        color: '#ffffff',
                        letterSpacing: '0.5px',
                        display: 'block',
                      }}
                    >
                      {eventDate}
                    </div>
                    <div
                      style={{
                        fontSize: '14px',
                        color: '#6b7280',
                        fontWeight: 400,
                        display: 'block',
                      }}
                    >
                      {eventTime}
                    </div>
                  </div>
                </div>

                {/* Presented By */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: '10px',
                  }}
                >
                  <span
                    style={{
                      fontSize: '12px',
                      textTransform: 'uppercase',
                      letterSpacing: '1px',
                      color: '#6b7280',
                      fontWeight: 400,
                    }}
                  >
                    Presented by
                  </span>
                  <img
                    src={logoImage}
                    alt="OppSkills"
                    width={72}
                    height={72}
                    style={{
                      objectFit: 'contain',
                    }}
                  />
                </div>
              </div>

              {/* Vertical Separator */}
              <div
                style={{
                  position: 'absolute',
                  right: '220px',
                  top: '50px',
                  bottom: '50px',
                  width: '1px',
                  background: 'linear-gradient(to bottom, transparent, rgba(255, 255, 255, 0.2) 20%, rgba(255, 255, 255, 0.2) 80%, transparent)',
                }}
              />

              {/* Right Section */}
              <div
                style={{
                  width: '200px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingLeft: '25px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '20px',
                    transform: 'rotate(90deg)',
                    transformOrigin: 'center',
                  }}
                >
                  <div
                    style={{
                      fontSize: '16px',
                      color: '#9ca3af',
                      letterSpacing: '3px',
                      fontWeight: 500,
                      textTransform: 'uppercase',
                      display: 'block',
                    }}
                  >
                    {ticketId}
                  </div>
                  <img
                    src={qrCodeDataUrl}
                    alt="QR Code"
                    width={300}
                    height={300}
                    style={{
                      objectFit: 'contain',
                      opacity: 0.9,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
      {
        width,
        height,
      }
    );
  } catch (e: unknown) {
    console.error('Error generating OG image:', e);
    return new Response(`Failed to generate the image: ${e instanceof Error ? e.message : 'Unknown error'}`, {
      status: 500,
    });
  }
}

