import { env } from "./env";

export async function sendVerificationEmail(email: string, url: string): Promise<boolean> {
  const host = env.EMAIL_SERVER_HOST;
  const port = env.EMAIL_SERVER_PORT;
  const user = env.EMAIL_SERVER_USER;
  const pass = env.EMAIL_SERVER_PASS;
  const from = env.EMAIL_FROM;
  if (!host || !port || !user || !pass || !from) {
    console.log(`[auth] Magic link for ${email}: ${url}`);
    return false;
  }

  const nodemailer = await import("nodemailer");
  const transport = nodemailer.default.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  await transport.sendMail({
    to: email,
    from,
    subject: "Sign in to Spreddit",
    text: `Sign in to Spreddit: ${url}\n\nThis link expires in 10 minutes.\n`,
    html: `<p>Sign in to Spreddit:</p><p><a href="${url}">${url}</a></p><p>This link expires in 10 minutes.</p>`,
  });
  return true;
}

export async function sendWithdrawalNotice(email: string, amountCents: number) {
  const host = env.EMAIL_SERVER_HOST;
  const port = env.EMAIL_SERVER_PORT;
  const user = env.EMAIL_SERVER_USER;
  const pass = env.EMAIL_SERVER_PASS;
  const from = env.EMAIL_FROM;
  if (!host || !port || !user || !pass || !from) return;

  const nodemailer = await import("nodemailer");
  const transport = nodemailer.default.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  const dollars = (amountCents / 100).toFixed(2);

  await transport.sendMail({
    to: email,
    from,
    subject: `Spreddit withdrawal of $${dollars} is processing`,
    text: `Your Spreddit withdrawal of $${dollars} is being processed. It should arrive within 5-7 business days.\n`,
    html: `<p>Your Spreddit withdrawal of <strong>$${dollars}</strong> is being processed.</p><p>It should arrive within 5-7 business days.</p>`,
  });
}