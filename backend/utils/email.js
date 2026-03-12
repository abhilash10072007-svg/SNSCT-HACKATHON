const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: { rejectUnauthorized: false }
});

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const otpEmailTemplate = (otp, type, name) => {
  const titles = {
    'email-verify': 'Verify Your Email',
    'password-reset': 'Reset Your Password',
    'login': 'Login OTP'
  };
  const messages = {
    'email-verify': 'Welcome to Smart Doubt Exchange! Please verify your email to get started.',
    'password-reset': 'You requested to reset your password. Use the OTP below.',
    'login': 'Your one-time login code for Smart Doubt Exchange.'
  };

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${titles[type]}</title>
</head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Arial,sans-serif;background:#0f0f1a;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f1a;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#1a1a2e;border-radius:16px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,0.5);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#6c63ff,#3ecfff);padding:36px 40px;text-align:center;">
              <div style="font-size:32px;margin-bottom:8px;">🎓</div>
              <h1 style="margin:0;color:#fff;font-size:24px;font-weight:700;letter-spacing:-0.5px;">Smart Doubt Exchange</h1>
              <p style="margin:8px 0 0;color:rgba(255,255,255,0.8);font-size:14px;">${titles[type]}</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <p style="color:#c4c4d4;font-size:16px;margin:0 0 8px;">Hi ${name || 'there'},</p>
              <p style="color:#8888aa;font-size:15px;line-height:1.6;margin:0 0 32px;">${messages[type]}</p>
              
              <!-- OTP Box -->
              <div style="background:#0f0f1a;border:2px solid #6c63ff;border-radius:12px;padding:28px;text-align:center;margin-bottom:32px;">
                <p style="color:#8888aa;font-size:13px;text-transform:uppercase;letter-spacing:2px;margin:0 0 16px;">Your Verification Code</p>
                <div style="letter-spacing:12px;font-size:42px;font-weight:800;color:#6c63ff;font-family:'Courier New',monospace;">${otp}</div>
                <p style="color:#555577;font-size:13px;margin:16px 0 0;">⏱ Valid for <strong style="color:#ff6b6b;">10 minutes</strong> only</p>
              </div>
              
              <div style="background:#1e1e3a;border-radius:8px;padding:16px 20px;margin-bottom:24px;">
                <p style="color:#8888aa;font-size:13px;margin:0;">🔒 <strong style="color:#c4c4d4;">Security tip:</strong> Never share this code with anyone. Smart Doubt Exchange will never ask for your OTP.</p>
              </div>
              
              <p style="color:#555577;font-size:13px;margin:0;">If you didn't request this, please ignore this email or contact support.</p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#0f0f1a;padding:24px 40px;border-top:1px solid #1e1e3a;text-align:center;">
              <p style="color:#444466;font-size:12px;margin:0;">© 2025 Smart Doubt Exchange • Built for learners, by learners</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
};

const sendOTPEmail = async (email, otp, type, name) => {
  const subjects = {
    'email-verify': '🎓 Verify your Smart Doubt Exchange account',
    'password-reset': '🔐 Reset your Smart Doubt Exchange password',
    'login': '🔑 Your Smart Doubt Exchange login code'
  };

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: subjects[type],
    html: otpEmailTemplate(otp, type, name)
  });
};

const sendNotificationEmail = async (email, name, subject, message) => {
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: `📬 ${subject} - Smart Doubt Exchange`,
    html: `
      <div style="font-family:'Segoe UI',Arial,sans-serif;background:#0f0f1a;padding:40px 20px;min-height:100vh;">
        <div style="max-width:560px;margin:0 auto;background:#1a1a2e;border-radius:16px;overflow:hidden;">
          <div style="background:linear-gradient(135deg,#6c63ff,#3ecfff);padding:24px 32px;">
            <h2 style="margin:0;color:#fff;font-size:20px;">Smart Doubt Exchange</h2>
          </div>
          <div style="padding:32px;">
            <p style="color:#c4c4d4;font-size:15px;">Hi ${name},</p>
            <p style="color:#8888aa;font-size:15px;line-height:1.6;">${message}</p>
          </div>
        </div>
      </div>
    `
  });
};

module.exports = { generateOTP, sendOTPEmail, sendNotificationEmail };
