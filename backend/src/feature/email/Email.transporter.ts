import nodemailer, { Transporter } from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';
import { ServerError } from '../../types/response.types';
import { 
    getNodeEnv, 
    getSenderEmail, 
    getSmtpAppPassword, 
    getSmtpHost, 
    getSmtpPort, 
    getSmtpSecure 
} from '../../config/env.config';

// Singleton transporter instance
let transporterInstance: Transporter<SMTPTransport.SentMessageInfo> | null = null;
let isTransporterVerified = false;

/**
 * Create and verify SMTP transporter (singleton pattern)
 */
export const getTransporter = async (): Promise<Transporter<SMTPTransport.SentMessageInfo>> => {
    // Return existing instance if already created and verified
    if (transporterInstance && isTransporterVerified) {
        return transporterInstance;
    }

    try {
        // Create SMTP transport options
        const transportOptions: SMTPTransport.Options = {
            host: getSmtpHost(),
            port: getSmtpPort(),
            secure: getSmtpSecure(), // true for 465, false for other ports
            auth: {
                user: getSenderEmail(),
                pass: getSmtpAppPassword() // Use app-specific password here
            },
            // Additional options for better reliability
            tls: {
                // Do not fail on invalid certs (for development)
                rejectUnauthorized: getNodeEnv() === 'production'
            },
            // Connection timeouts
            connectionTimeout: 60000, // 60 seconds
            greetingTimeout: 30000, // 30 seconds
            socketTimeout: 60000, // 60 seconds
        };

        // Create SMTP transporter with proper typing
        transporterInstance = nodemailer.createTransport(transportOptions);

        // Test connection only once
        if (!isTransporterVerified) {
            await transporterInstance.verify();
            isTransporterVerified = true;
            console.log('SMTP connection verified successfully');
        }

        return transporterInstance;
    } catch (error) {
        console.error('Failed to create email transporter:', error);
        // Reset state on error
        transporterInstance = null;
        isTransporterVerified = false;
        throw new ServerError('Failed to create email transporter');
    }
};

/**
 * Reset the transporter (useful for configuration changes or error recovery)
 */
export const resetTransporter = (): void => {
    if (transporterInstance) {
        transporterInstance.close();
    }
    transporterInstance = null;
    isTransporterVerified = false;
    console.log('Email transporter reset');
};

/**
 * Get transporter connection status
 */
export const getTransporterStatus = (): { connected: boolean; verified: boolean } => {
    return {
        connected: transporterInstance !== null,
        verified: isTransporterVerified
    };
};

/**
 * Gracefully close the transporter (useful for application shutdown)
 */
export const closeTransporter = async (): Promise<void> => {
    if (transporterInstance) {
        transporterInstance.close();
        transporterInstance = null;
        isTransporterVerified = false;
        console.log('Email transporter closed gracefully');
    }
};

/**
 * Test email configuration
 */
export const testEmailConfiguration = async (): Promise<boolean> => {
    try {
        await getTransporter();
        console.log('✅ Email configuration test passed');
        return true;
    } catch (error) {
        console.error('❌ Email configuration test failed:', error);
        return false;
    }
};