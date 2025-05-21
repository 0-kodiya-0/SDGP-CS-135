import nodemailer from 'nodemailer';
import { google } from 'googleapis';
import { ServerError } from '../../types/response.types';

// Use environment variables for these values in production
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.EMAIL_REDIRECT_URI;
const REFRESH_TOKEN = process.env.EMAIL_REFRESH_TOKEN;
const SENDER_EMAIL = process.env.SENDER_EMAIL;
const APP_NAME = process.env.APP_NAME;
const BASE_URL = process.env.BASE_URL;

/**
 * Create OAuth2 client for Gmail API
 */
const createTransporter = async () => {
    try {
        const oauth2Client = new google.auth.OAuth2(
            CLIENT_ID,
            CLIENT_SECRET,
            REDIRECT_URI
        );

        oauth2Client.setCredentials({
            refresh_token: REFRESH_TOKEN
        });

        // Get access token from refresh token
        const accessToken = await oauth2Client.getAccessToken();

        // Create SMTP transporter
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                type: 'OAuth2',
                user: SENDER_EMAIL,
                clientId: CLIENT_ID,
                clientSecret: CLIENT_SECRET,
                refreshToken: REFRESH_TOKEN,
                accessToken: accessToken.token || ''
            }
        });

        // Test connection
        await transporter.verify();
        return transporter;
    } catch (error) {
        console.error('Failed to create email transporter:', error);
        
        // Fallback to a simple transport for development
        if (process.env.NODE_ENV !== 'production') {
            console.log('Using development email transport');
            return nodemailer.createTransport({
                host: 'smtp.ethereal.email',
                port: 587,
                secure: false,
                auth: {
                    user: 'ethereal-test-account@ethereal.email', // Replace with a real ethereal account
                    pass: 'ethereal-password'                     // Replace with a real ethereal password
                }
            });
        }
        
        throw new ServerError('Failed to create email transporter');
    }
};

/**
 * Send email verification
 */
export async function sendVerificationEmail(email: string, firstName: string, token: string): Promise<void> {
    const transporter = await createTransporter();
    
    // Create verification URL
    const verificationUrl = `${BASE_URL}/api/v1/account/verify-email?token=${token}`;
    
    // Email content
    const mailOptions = {
        from: `"${APP_NAME}" <${SENDER_EMAIL}>`,
        to: email,
        subject: `Verify your email address for ${APP_NAME}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">Hello, ${firstName}!</h2>
                <p>Thank you for signing up for ${APP_NAME}. Please verify your email address by clicking the button below:</p>
                <div style="margin: 30px 0;">
                    <a href="${verificationUrl}" style="background-color: #4CAF50; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">
                        Verify Email Address
                    </a>
                </div>
                <p>If you didn't create an account with us, you can safely ignore this email.</p>
                <p>This link will expire in 24 hours.</p>
                <p>If the button above doesn't work, copy and paste this URL into your browser:</p>
                <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
                <hr style="border: 1px solid #eee; margin: 20px 0;">
                <p style="color: #777; font-size: 12px;">
                    &copy; ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.
                </p>
            </div>
        `
    };
    
    // Send email
    await transporter.sendMail(mailOptions);
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(email: string, firstName: string, token: string): Promise<void> {
    const transporter = await createTransporter();
    
    // Create reset URL
    const resetUrl = `${BASE_URL}/reset-password?token=${token}`;
    
    // Email content
    const mailOptions = {
        from: `"${APP_NAME}" <${SENDER_EMAIL}>`,
        to: email,
        subject: `Reset your password for ${APP_NAME}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">Hello, ${firstName}!</h2>
                <p>We received a request to reset your password for ${APP_NAME}. Click the button below to reset it:</p>
                <div style="margin: 30px 0;">
                    <a href="${resetUrl}" style="background-color: #2196F3; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">
                        Reset Password
                    </a>
                </div>
                <p>If you didn't request this, you can safely ignore this email. Your password will remain unchanged.</p>
                <p>This link will expire in 10 minutes.</p>
                <p>If the button above doesn't work, copy and paste this URL into your browser:</p>
                <p style="word-break: break-all; color: #666;">${resetUrl}</p>
                <hr style="border: 1px solid #eee; margin: 20px 0;">
                <p style="color: #777; font-size: 12px;">
                    &copy; ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.
                </p>
            </div>
        `
    };
    
    // Send email
    await transporter.sendMail(mailOptions);
}

/**
 * Send password changed notification
 */
export async function sendPasswordChangedNotification(email: string, firstName: string): Promise<void> {
    const transporter = await createTransporter();
    
    // Email content
    const mailOptions = {
        from: `"${APP_NAME}" <${SENDER_EMAIL}>`,
        to: email,
        subject: `Your password was changed on ${APP_NAME}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">Hello, ${firstName}!</h2>
                <p>We're letting you know that your password for ${APP_NAME} was recently changed.</p>
                <p>If you made this change, you don't need to do anything further.</p>
                <p>If you didn't change your password, please contact our support team immediately or reset your password.</p>
                <div style="margin: 30px 0;">
                    <a href="${BASE_URL}/reset-password" style="background-color: #F44336; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">
                        Reset Password
                    </a>
                </div>
                <hr style="border: 1px solid #eee; margin: 20px 0;">
                <p style="color: #777; font-size: 12px;">
                    &copy; ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.
                </p>
            </div>
        `
    };
    
    // Send email
    await transporter.sendMail(mailOptions);
}

/**
 * Send successful login notification
 */
export async function sendLoginNotification(email: string, firstName: string, ipAddress: string, device: string): Promise<void> {
    const transporter = await createTransporter();
    
    // Email content
    const mailOptions = {
        from: `"${APP_NAME}" <${SENDER_EMAIL}>`,
        to: email,
        subject: `New login detected on ${APP_NAME}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">Hello, ${firstName}!</h2>
                <p>We detected a new login to your ${APP_NAME} account.</p>
                <div style="background-color: #f5f5f5; padding: 15px; border-radius: 4px; margin: 20px 0;">
                    <p><strong>IP Address:</strong> ${ipAddress}</p>
                    <p><strong>Device:</strong> ${device}</p>
                    <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
                </div>
                <p>If this was you, you don't need to take any action.</p>
                <p>If you don't recognize this login, please secure your account by changing your password immediately.</p>
                <div style="margin: 30px 0;">
                    <a href="${BASE_URL}/account/security" style="background-color: #F44336; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">
                        Secure Account
                    </a>
                </div>
                <hr style="border: 1px solid #eee; margin: 20px 0;">
                <p style="color: #777; font-size: 12px;">
                    &copy; ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.
                </p>
            </div>
        `
    };
    
    // Send email
    await transporter.sendMail(mailOptions);
}

/**
 * Send two-factor authentication enabled notification
 */
export async function sendTwoFactorEnabledNotification(email: string, firstName: string): Promise<void> {
    const transporter = await createTransporter();
    
    // Email content
    const mailOptions = {
        from: `"${APP_NAME}" <${SENDER_EMAIL}>`,
        to: email,
        subject: `Two-factor authentication enabled on ${APP_NAME}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">Hello, ${firstName}!</h2>
                <p>This is a confirmation that two-factor authentication has been enabled on your ${APP_NAME} account.</p>
                <p>Now your account is more secure! You'll need to provide a verification code from your authenticator app each time you log in.</p>
                <p>If you didn't make this change, please contact our support team immediately.</p>
                <hr style="border: 1px solid #eee; margin: 20px 0;">
                <p style="color: #777; font-size: 12px;">
                    &copy; ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.
                </p>
            </div>
        `
    };
    
    // Send email
    await transporter.sendMail(mailOptions);
}