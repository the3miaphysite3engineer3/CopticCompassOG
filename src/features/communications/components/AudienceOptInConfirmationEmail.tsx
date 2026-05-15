import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Text,
} from "@react-email/components";
import * as React from "react";

import { mailBrand, mailBrandColors } from "@/lib/communications/mailBrand";
import type { Language } from "@/types/i18n";

type AudienceOptInConfirmationEmailProps = {
  confirmationUrl: string;
  language: Language;
  recipientName?: string | null;
};

const copy = {
  en: {
    body: "Please confirm that you want to receive updates from Coptic Compass about new lessons, book releases, and major project announcements.",
    cta: "Confirm email updates",
    fallback: "If the button does not work, open this link in your browser:",
    greeting: "Hi",
    signature: "Coptic Compass",
    subject: "Confirm your Coptic Compass email updates",
    thanks: "If you did not request this, you can safely ignore this email.",
    title: "Confirm your Coptic Compass updates",
  },
  nl: {
    body: "Bevestig dat u updates van Coptic Compass wilt ontvangen over nieuwe lessen, boekuitgaven en belangrijke projectaankondigingen.",
    cta: "E-mailupdates bevestigen",
    fallback: "Werkt de knop niet, open dan deze link in uw browser:",
    greeting: "Dag",
    signature: "Coptic Compass",
    subject: "Bevestig uw Coptic Compass e-mailupdates",
    thanks:
      "Hebt u dit niet aangevraagd, dan kunt u deze e-mail gerust negeren.",
    title: "Bevestig uw updates van Coptic Compass",
  },
} as const;

export function AudienceOptInConfirmationEmail({
  confirmationUrl,
  language,
  recipientName,
}: AudienceOptInConfirmationEmailProps) {
  const localizedCopy = copy[language];
  const normalizedName = recipientName?.trim();

  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Text style={brandLine}>
            {mailBrand.brandName} • {mailBrand.descriptor}
          </Text>
          <Heading as="h2" style={heading}>
            {localizedCopy.title}
          </Heading>
          <Text style={paragraph}>
            {localizedCopy.greeting}
            {normalizedName ? ` ${normalizedName}` : ""},
          </Text>
          <Text style={paragraph}>{localizedCopy.body}</Text>
          <Button href={confirmationUrl} style={button}>
            {localizedCopy.cta}
          </Button>
          <Hr style={hr} />
          <Text style={paragraph}>{localizedCopy.fallback}</Text>
          <Link href={confirmationUrl} style={link}>
            {confirmationUrl}
          </Link>
          <Text style={footer}>
            {localizedCopy.signature}
            <br />
            {mailBrand.descriptor}
          </Text>
          <Text style={footer}>{localizedCopy.thanks}</Text>
        </Container>
      </Body>
    </Html>
  );
}

export function getAudienceOptInConfirmationSubject(language: Language) {
  return copy[language].subject;
}

const main = {
  backgroundColor: mailBrandColors.paper,
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: mailBrandColors.surface,
  border: `1px solid ${mailBrandColors.line}`,
  borderRadius: "10px",
  margin: "0 auto",
  padding: "28px 32px 48px",
  marginBottom: "64px",
};

const brandLine = {
  borderTop: `6px solid ${mailBrandColors.gold}`,
  color: mailBrandColors.goldStrong,
  fontSize: "12px",
  fontWeight: "700",
  letterSpacing: "0.08em",
  margin: "-28px -32px 24px",
  padding: "18px 32px 0",
  textTransform: "uppercase" as const,
};

const heading = {
  fontSize: "24px",
  letterSpacing: "0",
  lineHeight: "1.3",
  fontWeight: "600",
  color: mailBrandColors.ink,
  padding: "17px 0 0",
};

const paragraph = {
  margin: "0 0 15px",
  fontSize: "15px",
  lineHeight: "1.6",
  color: mailBrandColors.ink,
};

const hr = {
  borderColor: mailBrandColors.line,
  margin: "32px 0 20px",
};

const button = {
  backgroundColor: mailBrandColors.ink,
  borderRadius: "8px",
  color: mailBrandColors.paper,
  display: "inline-block",
  fontSize: "15px",
  fontWeight: "600",
  padding: "14px 24px",
  textDecoration: "none",
};

const link = {
  color: mailBrandColors.coptic,
  fontSize: "13px",
  lineHeight: "1.6",
  wordBreak: "break-all" as const,
};

const footer = {
  marginTop: "24px",
  fontSize: "13px",
  lineHeight: "1.6",
  color: mailBrandColors.muted,
};
