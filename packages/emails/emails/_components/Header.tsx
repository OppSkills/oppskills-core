import {
  Img,
  Link,
  Section,
  Row,
  Column,
} from '@react-email/components';
import * as React from 'react';

const baseUrl = 'https://www.oppskills.com';
const iconColor = '7C737E';

const logoUrl = `${baseUrl}/logo.png`;

export function Header() {
  return (
    <Section style={header}>
      <Row>
        <Column align="left">
          <Img
            src={logoUrl}
            width="140"
            height="37"
            alt="OppSkills"
            style={logoStyle}
          />
        </Column>
        <Column align="right">
          <Row style={socialRow}>
            <Column style={socialColumn}>
              <Link href="https://www.instagram.com/oppskills.global/">
                <Img
                  src={`https://img.icons8.com/ios-filled/50/${iconColor}/instagram-new.png`}
                  width="24"
                  height="24"
                  alt="Instagram"
                />
              </Link>
            </Column>
            <Column style={socialColumn}>
              <Link href="https://www.linkedin.com/company/oppskills">
                <Img
                  src={`https://img.icons8.com/ios-filled/50/${iconColor}/linkedin.png`}
                  width="24"
                  height="24"
                  alt="LinkedIn"
                />
              </Link>
            </Column>
            <Column style={socialColumn}>
              <Link href="https://www.threads.com/@oppskills.global">
                <Img
                  src={`https://img.icons8.com/ios-filled/50/${iconColor}/threads.png`}
                  width="24"
                  height="24"
                  alt="Threads"
                />
              </Link>
            </Column>
          </Row>
        </Column>
      </Row>
    </Section>
  );
}

const header: React.CSSProperties = {
  padding: '32px 40px',
};

const socialRow: React.CSSProperties = {
  width: 'auto',
  display: 'inline-block',
};

const socialColumn: React.CSSProperties = {
  paddingLeft: '12px',
};

const logoStyle: React.CSSProperties = {
  display: 'block',
  maxWidth: '140px',
  height: 'auto',
};

