import "server-only";
import { SendEmailCommand, SESv2Client } from "@aws-sdk/client-sesv2";
import { createTransport, type Transporter } from "nodemailer";

export type Mail = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

let transporter: Transporter | undefined;

function getTransporter() {
  if (!transporter) {
    const smtpUrl = process.env.SMTP_URL;
    transporter =
      smtpUrl !== undefined && smtpUrl !== ""
        ? createTransport(smtpUrl)
        : createTransport({
            SES: { sesClient: new SESv2Client({}), SendEmailCommand },
          });
  }
  return transporter;
}

function maskAddress(address: string) {
  const [local = "", domain = ""] = address.split("@");
  return `${local.slice(0, 1)}***@${domain}`;
}

function errorName(error: unknown) {
  return error instanceof Error ? error.name : "UnknownError";
}

export async function sendMail(mail: Mail): Promise<boolean> {
  const from = process.env.MAIL_FROM;
  if (from === undefined || from === "") {
    throw new Error("MAIL_FROM must be set to send e-mail.");
  }

  try {
    await getTransporter().sendMail({ from, ...mail });
    return true;
  } catch (error) {
    console.error(
      JSON.stringify({
        event: "mail-not-sent",
        to: maskAddress(mail.to),
        error: errorName(error),
      }),
    );
    return false;
  }
}
