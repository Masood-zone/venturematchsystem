import "server-only";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import nodemailer from "nodemailer";
import { render } from "@react-email/render";
import { EmailLayout, type EmailContent } from "./email-layout";

type Recipient = { userEmail: string; userName?: string };
type EmailMessage =
  | ({ kind: "welcome" } & Recipient)
  | ({ kind: "application"; ventureName: string } & Recipient)
  | ({ kind: "application-approved"; ventureName: string } & Recipient)
  | ({ kind: "application-declined"; ventureName: string; reason: string } & Recipient)
  | ({ kind: "venture-activity"; title: string; body: string; path: string } & Recipient)
  | ({ kind: "password-reset"; resetUrl: string } & Recipient);

function appUrl(path: string) {
  const origin = process.env.BETTER_AUTH_URL;
  if (!origin) throw new Error("BETTER_AUTH_URL is required for email links.");
  return new URL(path, origin).href;
}

export async function renderEmail(message: EmailMessage) {
  const greeting = message.userName ? `Hi ${message.userName},` : "Hello,";
  let content: EmailContent;
  switch (message.kind) {
    case "venture-activity":
      content = {
        subject: message.title,
        preview: message.body,
        heading: message.title,
        paragraphs: [greeting, message.body],
        action: "Open VentureMatch",
        url: appUrl(message.path),
      };
      break;
    case "welcome":
      content = {
        subject: "Welcome to VentureMatch",
        preview: "Your VentureMatch account is ready.",
        heading: "Welcome to VentureMatch",
        paragraphs: [greeting, "Your account is ready. Sign in to complete your profile, discover ventures, and connect with other USTED Kumasi students."],
        action: "Sign in to VentureMatch",
        url: appUrl("/login"),
      };
      break;
    case "application":
      content = {
        subject: "Your VentureMatch application was submitted",
        preview: "The venture owner can now review your application.",
        heading: "Application submitted",
        paragraphs: [greeting, `Your application to ${message.ventureName} has been submitted for review. You can track its status in My applications.`],
        action: "View my applications",
        url: appUrl("/ventures#my-applications-heading"),
      };
      break;
    case "application-approved":
      content = {
        subject: "Your VentureMatch application was approved",
        preview: "You can find your new team in My Ventures.",
        heading: "Application approved",
        paragraphs: [greeting, `Your application to ${message.ventureName} was approved. You’re now a team member and can find the venture under Joined ventures in My Ventures.`],
        action: "Open My Ventures",
        url: appUrl("/ventures"),
      };
      break;
    case "application-declined":
      content = {
        subject: "Your VentureMatch application was declined",
        preview: "The venture owner has reviewed your application.",
        heading: "Application declined",
        paragraphs: [greeting, `The owner of ${message.ventureName} declined your application.`, "Reason from the venture owner:", message.reason],
        action: "View my applications",
        url: appUrl("/ventures#my-applications-heading"),
      };
      break;
    case "password-reset":
      content = {
        subject: "Reset your VentureMatch password",
        preview: "Use this link within one hour to set a new password.",
        heading: "Reset your password",
        paragraphs: [greeting, "We received a request to reset your VentureMatch password. This link expires in one hour and can be used once.", "If you did not request a reset, you can ignore this email."],
        action: "Reset my password",
        url: message.resetUrl,
      };
      break;
  }
  return {
    subject: content.subject,
    html: await render(EmailLayout(content)),
    text: [content.heading, ...content.paragraphs, `${content.action}\n${content.url}`, "VentureMatch · USTED Kumasi"].join("\n\n"),
  };
}

async function smtpConfig() {
  const service = process.env.SMTP_SERVICE?.trim();
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASSWORD || process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM?.trim();
  const secureSetting = process.env.SMTP_SECURE?.trim();
  const port = Number(process.env.SMTP_PORT || (secureSetting === "true" ? 465 : 587));
  const secure = secureSetting === undefined ? port === 465 : secureSetting === "true";
  if ((!host && !service) || !user || !pass?.trim() || !from) {
    throw new Error("SMTP host or service, username, password, and sender are required.");
  }
  if (!Number.isInteger(port) || port < 1 || port > 65_535 || (secureSetting !== undefined && secureSetting !== "true" && secureSetting !== "false")) {
    throw new Error("Invalid SMTP port or TLS setting.");
  }
  // Respect the deployment's OS resolver, including split DNS, while verifying TLS against the configured hostname.
  const endpoint = host && !isIP(host)
    ? { host: (await lookup(host)).address, port, tls: { servername: host } }
    : host ? { host, port } : { service };
  return {
    from,
    transport: {
      ...endpoint,
      secure,
      requireTLS: true,
      auth: { user, pass },
      connectionTimeout: 5_000,
      greetingTimeout: 5_000,
      socketTimeout: 10_000,
    },
  };
}

export const emailService = {
  async send(message: EmailMessage) {
    const { from, transport } = await smtpConfig();
    const email = await renderEmail(message);
    const result = await nodemailer.createTransport(transport).sendMail({ from, to: message.userEmail, ...email });
    if (!result.accepted.length || result.rejected.length) throw new Error("SMTP did not accept the message.");
  },
};
