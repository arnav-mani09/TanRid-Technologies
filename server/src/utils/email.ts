import nodemailer from "nodemailer";

const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  EMAIL_FROM = "no-reply@tanrid.com",
} = process.env;

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT ? Number(SMTP_PORT) : 465,
  secure: (SMTP_PORT ? Number(SMTP_PORT) : 465) === 465,
  auth: SMTP_USER && SMTP_PASS ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
});

export const sendEmail = async (to: string, subject: string, text: string) => {
  if (!SMTP_HOST) {
    console.warn("SMTP configuration is missing; skipping email send.");
    return;
  }

  await transporter.sendMail({
    from: EMAIL_FROM,
    to,
    subject,
    text,
  });
};

export const sendWelcomeEmail = async (email: string) =>
  sendEmail(email, "Welcome to TanRid Enterprises", "You just created an account for TanRid Enterprises.");
