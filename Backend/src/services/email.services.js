
import transporter from "../config/email.config.js";

// EMAIL VERIFICATION
const sendVerificationEmail = async (email, token) => {
  const verificationLink =
    `${process.env.BACKEND_URL}/api/auth/verify-email/${token}`;

  const mailOptions = {
    from: `"Subscription Management System" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Verify Your Subscription Management System Account",

    text: `Please verify your email address: ${verificationLink}`,

    html: `
      <div style="font-family: Arial, sans-serif; padding: 30px; text-align: center; background: #f8fafc;">
        <div style="max-width: 500px; margin: auto; background: white; padding: 30px; border-radius: 10px;">
          <h2 style="color: #2563eb;">Welcome!</h2>
          <p>Thank you for creating your account.</p>
          <a href="${verificationLink}"
             style="background: #2563eb; color: white; padding: 14px 25px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Verify Email Address
          </a>
          <p>This link expires in 15 minutes.</p>
        </div>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
};


// PASSWORD RESET EMAIL
export const sendPasswordResetEmail = async (email, token) => {
  const frontendUrl = process.env.FRONTEND_URL;

  if (!frontendUrl) {
    throw new Error("FRONTEND_URL is not configured");
  }

  const resetLink =
    `${frontendUrl.replace(/\/$/, "")}/reset-password/${token}`;

  const mailOptions = {
    from: `"Subscription Management System" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Reset Your Subscription Management System Password",

    text: `You requested a password reset. Open this link to reset your password: ${resetLink}. This link expires in 15 minutes. If you did not request this, ignore this email.`,

    html: `
      <div style="font-family: Arial, sans-serif; padding: 30px; text-align: center; background: #f8fafc;">
        <div style="max-width: 500px; margin: auto; background: white; padding: 30px; border-radius: 10px;">
          <h2 style="color: #2563eb;">Password Reset</h2>

          <p>We received a request to reset your password.</p>

          <a href="${resetLink}"
             style="background: #2563eb; color: white; padding: 14px 25px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0;">
            Reset Password
          </a>

          <p>This link expires in 15 minutes.</p>

          <p style="color: #64748b; font-size: 13px;">
            If you did not request a password reset, you can safely ignore this email.
          </p>
        </div>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
};

export default sendVerificationEmail;
