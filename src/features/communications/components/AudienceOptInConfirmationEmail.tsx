import * as React from "react";
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
import { mailBrand } from "@/lib/communications/mailBrand";
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
    body: "Bevestig dat je updates van Coptic Compass wilt ontvangen over nieuwe lessen, boekreleases en belangrijke projectaankondigingen.",
    cta: "E-mailupdates bevestigen",
    fallback: "Werkt de knop niet, open dan deze link in je browser:",
    greeting: "Dag",
    signature: "Coptic Compass",
    subject: "Bevestig je Coptic Compass e-mailupdates",
    thanks:
      "Heb je dit niet aangevraagd, dan kun je deze e-mail gerust negeren.",
    title: "Bevestig je updates van Coptic Compass",
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
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 32px 48px",
  marginBottom: "64px",
};

const heading = {
  fontSize: "24px",
  letterSpacing: "-0.5px",
  lineHeight: "1.3",
  fontWeight: "500",
  color: "#1f2937",
  padding: "17px 0 0",
};

const paragraph = {
  margin: "0 0 15px",
  fontSize: "15px",
  lineHeight: "1.6",
  color: "#374151",
};

const hr = {
  borderColor: "#dfe1e4",
  margin: "32px 0 20px",
};

const button = {
  backgroundColor: "#0f766e",
  borderRadius: "999px",
  color: "#ffffff",
  display: "inline-block",
  fontSize: "15px",
  fontWeight: "600",
  padding: "14px 24px",
  textDecoration: "none",
};

const link = {
  color: "#0f766e",
  fontSize: "13px",
  lineHeight: "1.6",
  wordBreak: "break-all" as const,
};

const footer = {
  marginTop: "24px",
  fontSize: "13px",
  lineHeight: "1.6",
  color: "#6b7280",
};
