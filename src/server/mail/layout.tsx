import type { ReactNode } from "react";
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "react-email";

export const mailColors = {
  canvas: "#f4f4f5",
  card: "#ffffff",
  border: "#e4e4e7",
  foreground: "#09090b",
  secondary: "#3f3f46",
  muted: "#52525b",
  brand: "#4f46e5",
  onColor: "#ffffff",
};

const fontFamily =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif';

const phoneStyles = `
@media only screen and (max-width: 480px) {
  .mail-card > tbody > tr > td { padding: 24px 20px !important; }
}
`;

function Bar({ height }: { height: number }) {
  return (
    <td aria-hidden="true" style={{ width: 4, verticalAlign: "bottom" }}>
      <table role="presentation" cellPadding={0} cellSpacing={0}>
        <tbody>
          <tr>
            <td
              height={height}
              style={{
                width: 4,
                height,
                backgroundColor: mailColors.onColor,
                borderRadius: 1,
                fontSize: 0,
                lineHeight: 0,
              }}
            >
              &nbsp;
            </td>
          </tr>
        </tbody>
      </table>
    </td>
  );
}

function Gap() {
  return <td style={{ width: 2, fontSize: 0, lineHeight: 0 }}>&nbsp;</td>;
}

function Brand() {
  return (
    <table role="presentation" cellPadding={0} cellSpacing={0}>
      <tbody>
        <tr>
          <td
            aria-hidden="true"
            data-skip-in-text
            style={{
              width: 16,
              height: 16,
              padding: 6,
              borderRadius: 6,
              backgroundColor: mailColors.brand,
              verticalAlign: "bottom",
            }}
          >
            <table role="presentation" cellPadding={0} cellSpacing={0}>
              <tbody>
                <tr>
                  <Bar height={16} />
                  <Gap />
                  <Bar height={11} />
                  <Gap />
                  <Bar height={6} />
                </tr>
              </tbody>
            </table>
          </td>
          <td
            style={{
              paddingLeft: 8,
              fontSize: 16,
              fontWeight: 600,
              color: mailColors.foreground,
            }}
          >
            Kanbanary
          </td>
        </tr>
      </tbody>
    </table>
  );
}

export function MailText({
  children,
  small = false,
}: {
  children: ReactNode;
  small?: boolean;
}) {
  return (
    <Text
      style={{
        margin: "0 0 16px",
        fontSize: small ? 14 : 15,
        lineHeight: small ? "22px" : "24px",
        color: small ? mailColors.muted : mailColors.secondary,
      }}
    >
      {children}
    </Text>
  );
}

type MailLayoutProps = {
  to: string;
  preview: string;
  title: string;
  note: string;
  children: ReactNode;
};

export function MailLayout({
  to,
  preview,
  title,
  note,
  children,
}: MailLayoutProps) {
  return (
    <Html lang="pt-BR">
      <Head>
        <meta name="color-scheme" content="light" />
        <meta name="supported-color-schemes" content="light" />
        <style>{phoneStyles}</style>
      </Head>
      <Preview>{preview}</Preview>
      <Body
        style={{
          margin: 0,
          padding: "32px 16px",
          backgroundColor: mailColors.canvas,
          fontFamily,
          color: mailColors.foreground,
        }}
      >
        <Container style={{ maxWidth: 480 }}>
          <Section style={{ paddingBottom: 24 }}>
            <Brand />
          </Section>
          <Section
            className="mail-card"
            style={{
              padding: 32,
              border: `1px solid ${mailColors.border}`,
              borderRadius: 12,
              backgroundColor: mailColors.card,
            }}
          >
            <Heading
              as="h1"
              style={{
                margin: "0 0 16px",
                fontSize: 22,
                lineHeight: "30px",
                fontWeight: 600,
                color: mailColors.foreground,
              }}
            >
              {title}
            </Heading>
            {children}
            <Hr
              style={{
                margin: "8px 0 16px",
                borderColor: mailColors.border,
              }}
            />
            <Text
              style={{
                margin: 0,
                fontSize: 14,
                lineHeight: "22px",
                color: mailColors.muted,
              }}
            >
              {note}
            </Text>
          </Section>
          <Text
            style={{
              margin: "24px 0 0",
              fontSize: 13,
              lineHeight: "20px",
              color: mailColors.muted,
              overflowWrap: "anywhere",
              wordBreak: "break-word",
            }}
          >
            Você recebeu este e-mail porque {to} foi usado no Kanbanary. Este
            endereço não recebe respostas.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
