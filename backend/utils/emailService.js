import nodemailer from "nodemailer";

const createTransporter = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error("Email credentials not configured in .env file");
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

// OTP Email Template
export async function sendOTPEmail(to, subject, otp) {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"MEDILOG" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2 style="color: #2c5f2d;">MEDILOG</h2>
          <h3>Your OTP Code</h3>
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; text-align: center;">
            <h1 style="color: #2c5f2d; font-size: 48px; margin: 0;">${otp}</h1>
          </div>
          <p style="margin-top: 20px;">This OTP will expire in 5 minutes.</p>
          <p style="color: #666; font-size: 12px;">If you didn't request this, please ignore this email.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Email sending failed:", error.message);
    throw error;
  }
}

// Approval Email Template
export async function sendApprovalEmail(to, username, loginMethod, lrn) {
  try {
    const transporter = createTransporter();

    const loginMethodText =
      loginMethod === "email" ? "Email Address" : "Student ID";

    const mailOptions = {
      from: `"MEDILOG" <${process.env.EMAIL_USER}>`,
      to,
      subject: "MEDILOG - Account Approved! 🎉",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #2c5f2d 0%, #4a9d4f 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Welcome to MEDILOG!</h1>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #2c5f2d; margin-top: 0;">Hi ${username},</h2>
            
            <p style="font-size: 16px; line-height: 1.6; color: #333;">
              Great news! Your MEDILOG account has been <strong>approved by an administrator</strong>. 
              You can now access the student portal.
            </p>
            
            <div style="background: white; border-left: 4px solid #2c5f2d; padding: 20px; margin: 25px 0; border-radius: 5px;">
              <h3 style="color: #2c5f2d; margin-top: 0;">📋 Your Login Credentials</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #666; font-weight: bold;">Login with:</td>
                  <td style="padding: 8px 0; color: #2c5f2d; font-weight: bold;">${loginMethodText}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666; font-weight: bold;">Temporary Password:</td>
                  <td style="padding: 8px 0; color: #2c5f2d; font-weight: bold;">Your LRN (${lrn})</td>
                </tr>
              </table>
            </div>
            
            <div style="background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 0; color: #856404;">
                <strong>⚠️ Important:</strong> For security, you'll receive an OTP (One-Time Password) 
                via email each time you log in. You can skip this by checking "Remember this device" 
                during OTP verification.
              </p>
            </div>
            
            <h3 style="color: #2c5f2d;">🚀 Next Steps:</h3>
            <ol style="line-height: 2; color: #333;">
              <li>Go to the MEDILOG login page</li>
              <li>Enter your ${loginMethodText.toLowerCase()}</li>
              <li>Use your <strong>LRN as password</strong></li>
              <li>Verify the OTP sent to this email</li>
              <li>Start using your student portal!</li>
            </ol>
            
            <div style="text-align: center; margin-top: 30px;">
              <a href="${
                process.env.FRONTEND_URL || "http://localhost:5173"
              }/login/student" 
                 style="background: #2c5f2d; color: white; padding: 15px 40px; text-decoration: none; 
                        border-radius: 5px; font-weight: bold; display: inline-block;">
                Login Now
              </a>
            </div>
            
            <p style="color: #666; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
              If you have any questions or need assistance, please contact your administrator.
            </p>
          </div>
          
          <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
            <p>© 2024 MEDILOG. All rights reserved.</p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Approval email sent to: ${to}`);
  } catch (error) {
    console.error("Approval email sending failed:", error.message);
    throw error;
  }
}
