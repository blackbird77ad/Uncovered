import { Resend } from "resend";
import { env } from "../config/env.js";

const resend = env.resendApiKey ? new Resend(env.resendApiKey) : null;

async function sendEmail({ to, subject, html }) {
  if (!to || !resend) {
    if (!resend) {
      console.info(`[email] Resend disabled. Skipped: ${subject}`);
    }
    return;
  }

  await resend.emails.send({
    from: env.resendFrom,
    to,
    subject,
    html
  });
}

export async function sendSubmissionReceipt(story) {
  await sendEmail({
    to: story.contact?.email,
    subject: `UNCOVERED received ${story.storyId}`,
    html: `
      <h1>Story received</h1>
      <p>Thank you for trusting UNCOVERED with your submission.</p>
      <p>Your Story ID is <strong>${story.storyId}</strong>.</p>
      <p>Keep this ID for future updates. The original story will remain preserved.</p>
    `
  });
}

export async function sendAdminNotification(story) {
  await sendEmail({
    to: env.adminEmail,
    subject: `New UNCOVERED submission: ${story.title}`,
    html: `
      <h1>New submission</h1>
      <p><strong>${story.title}</strong></p>
      <p>Story ID: ${story.storyId}</p>
      <p>Category: ${story.category}</p>
      <p>Urgency: ${story.urgency}</p>
    `
  });
}

export async function sendContactNotification(message) {
  await sendEmail({
    to: env.adminEmail,
    subject: `UNCOVERED contact: ${message.topic}`,
    html: `
      <h1>Contact message</h1>
      <p><strong>${message.name || "Anonymous"}</strong> (${message.email || "No email"})</p>
      <p>${message.message}</p>
    `
  });
}
