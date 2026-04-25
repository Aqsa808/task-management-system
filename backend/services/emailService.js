const nodemailer = require('nodemailer');

// Create transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS // Use App Password, not regular password
  }
});

// Send verification email
const sendVerificationEmail = async (email, username, token) => {
  const verificationUrl = `http://localhost:3000/verify-email?token=${token}`;
  
  const mailOptions = {
    from: `"TaskZen 🔐" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Verify Your Email - TaskZen',
    html: `
      <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: auto; padding: 30px; background: #f8fafc; border-radius: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #1a1a1a; font-size: 28px;">⚡ TaskZen</h1>
          <p style="color: #64748b; font-size: 16px;">Verify your email to get started</p>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 15px; border: 2px solid #e2e8f0;">
          <h2 style="color: #1a1a1a; margin-bottom: 15px;">Welcome, ${username}! 👋</h2>
          <p style="color: #475569; line-height: 1.6; margin-bottom: 25px;">
            Thanks for signing up! Please click the button below to verify your email address and activate your account.
          </p>
          
          <a href="${verificationUrl}" style="display: block; background: #FF6B35; color: white; text-align: center; padding: 14px; border-radius: 10px; text-decoration: none; font-weight: bold; font-size: 16px; margin-bottom: 20px;">
            Verify Email Address
          </a>
          
          <p style="color: #94a3b8; font-size: 14px; text-align: center;">
            Or copy this link: <br/>
            <span style="color: #FF6B35;">${verificationUrl}</span>
          </p>
          
          <p style="color: #94a3b8; font-size: 12px; text-align: center; margin-top: 20px;">
            This link expires in 24 hours. If you didn't create an account, please ignore this email.
          </p>
        </div>
        
        <p style="text-align: center; color: #94a3b8; font-size: 12px; margin-top: 20px;">
          © ${new Date().getFullYear()} TaskZen. All rights reserved.
        </p>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
};

// Send OTP email (for 2FA)
const sendOTPEmail = async (email, username, otp) => {
  const mailOptions = {
    from: `"TaskZen 🔐" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Your OTP Code - TaskZen',
    html: `
      <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: auto; padding: 30px; background: #f8fafc; border-radius: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #1a1a1a; font-size: 28px;">⚡ TaskZen</h1>
          <p style="color: #64748b; font-size: 16px;">Your One-Time Password</p>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 15px; border: 2px solid #e2e8f0; text-align: center;">
          <h2 style="color: #1a1a1a; margin-bottom: 10px;">Hello, ${username}! 🔐</h2>
          <p style="color: #475569; margin-bottom: 25px;">Use this OTP to complete your login:</p>
          
          <div style="background: #FFF8F0; padding: 20px; border-radius: 10px; border: 2px dashed #FF6B35; margin-bottom: 20px;">
            <span style="font-size: 36px; font-weight: bold; color: #FF6B35; letter-spacing: 8px;">${otp}</span>
          </div>
          
          <p style="color: #94a3b8; font-size: 14px;">
            This OTP expires in 10 minutes. Do not share it with anyone.
          </p>
        </div>
        
        <p style="text-align: center; color: #94a3b8; font-size: 12px; margin-top: 20px;">
          © ${new Date().getFullYear()} TaskZen. All rights reserved.
        </p>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
};

// Send password reset email
const sendPasswordResetEmail = async (email, username, token) => {
  const resetUrl = `http://localhost:3000/reset-password?token=${token}`;
  
  const mailOptions = {
    from: `"TaskZen 🔐" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Reset Your Password - TaskZen',
    html: `
      <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: auto; padding: 30px; background: #f8fafc; border-radius: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #1a1a1a; font-size: 28px;">⚡ TaskZen</h1>
          <p style="color: #64748b; font-size: 16px;">Password Reset Request</p>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 15px; border: 2px solid #e2e8f0;">
          <h2 style="color: #1a1a1a; margin-bottom: 15px;">Hey ${username}! 🔑</h2>
          <p style="color: #475569; line-height: 1.6; margin-bottom: 25px;">
            We received a request to reset your password. Click the button below to create a new password.
          </p>
          
          <a href="${resetUrl}" style="display: block; background: #FF6B35; color: white; text-align: center; padding: 14px; border-radius: 10px; text-decoration: none; font-weight: bold; font-size: 16px; margin-bottom: 20px;">
            Reset Password
          </a>
          
          <p style="color: #94a3b8; font-size: 14px; text-align: center;">
            Or copy this link: <br/>
            <span style="color: #FF6B35;">${resetUrl}</span>
          </p>
          
          <p style="color: #94a3b8; font-size: 12px; text-align: center; margin-top: 20px;">
            This link expires in 1 hour. If you didn't request this, please ignore.
          </p>
        </div>
        
        <p style="text-align: center; color: #94a3b8; font-size: 12px; margin-top: 20px;">
          © ${new Date().getFullYear()} TaskZen. All rights reserved.
        </p>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
};

module.exports = { sendVerificationEmail, sendOTPEmail, sendPasswordResetEmail };