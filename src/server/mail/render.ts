import "server-only";
import type { ReactElement } from "react";
import { render } from "react-email";
import type { Mail } from "@/server/mail/send";

const textOptions = {
  plainText: true,
  htmlToTextOptions: {
    selectors: [{ selector: "h1", options: { uppercase: false } }],
  },
} as const;

export async function renderMail(
  to: string,
  subject: string,
  element: ReactElement,
): Promise<Mail> {
  const [html, text] = await Promise.all([
    render(element),
    render(element, textOptions),
  ]);
  return { to, subject, html, text };
}
