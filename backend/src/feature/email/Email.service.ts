import nodemailer from 'nodemailer';
import { promises as fs } from 'fs';
import path from 'path';
import { ServerError, ValidationError } from '../../types/response.types';
import { getTemplateMetadata, isValidTemplate, getTemplateFilePath } from './Email.utils';
import { EmailTemplate } from './Email.types';
import { getAppName, getBaseUrl, getNodeEnv, getSenderEmail, getSenderName, getSmtpAppPassword, getSmtpHost, getSmtpPort, getSmtpSecure } from '../../config/env.config';

// Template cache to avoid reading files repeatedly
const templateCache = new Map<EmailTemplate, string>();

/**
 * Load and cache HTML email templates
 */
async function loadTemplate(template: EmailTemplate): Promise<string> {
    if (templateCache.has(template)) {
        return templateCache.get(template)!;
    }

    try {
        const templateFileName = getTemplateFilePath(template);
        const templatePath = path.join(process.cwd(), 'src', 'feature', 'email', 'templates', templateFileName);
        const templateContent = await fs.readFile(templatePath, 'utf-8');
        templateCache.set(template, templateContent);
        return templateContent;
    } catch (error) {
        console.error(`Failed to load email template: ${template}`, error);
        throw new ServerError(`Email template not found: ${template}`);
    }
}

/**
 * Validate template variables
 */
function validateTemplateVariables(template: EmailTemplate, variables: Record<string, string>): void {
    const metadata = getTemplateMetadata(template);
    const missingVariables = metadata.requiredVariables.filter(varName => !variables[varName]);

    if (missingVariables.length > 0) {
        throw new ValidationError(
            `Missing required variables for template ${template}: ${missingVariables.join(', ')}`
        );
    }
}

/**
 * Replace template variables with actual values
 */
function replaceTemplateVariables(template: string, variables: Record<string, string>): string {
    let result = template;

    // Replace all {{VARIABLE}} patterns with actual values
    Object.entries(variables).forEach(([key, value]) => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        result = result.replace(regex, value || '');
    });

    return result;
}

/**
 * Generate plain text version from HTML
 */
function generatePlainText(html: string, variables: Record<string, string>): string {
    // Simple HTML to text conversion
    let text = html
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<[^>]*>/g, '')
        .replace(/\s+/g, ' ')
        .trim();

    // Replace template variables in plain text
    Object.entries(variables).forEach(([key, value]) => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        text = text.replace(regex, value || '');
    });

    return text;
}

/**
 * Create SMTP transporter using app password
 */
const createTransporter = async () => {
    try {
        // Create SMTP transporter with app password
        const transporter = nodemailer.createTransport({
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
            // Connection timeout
            connectionTimeout: 60000, // 60 seconds
            greetingTimeout: 30000, // 30 seconds
            socketTimeout: 60000, // 60 seconds
        });

        // Test connection
        await transporter.verify();
        console.log('SMTP connection verified successfully');

        return transporter;
    } catch (error) {
        console.log(error);
        throw new ServerError('Failed to create email transporter');
    }
};

/**
 * Generic email sender for custom templates with type safety
 */
export async function sendCustomEmail(
    to: string,
    subject: string,
    template: EmailTemplate,
    variables: Record<string, string>
): Promise<void> {
    const transporter = await createTransporter();

    // Add common variables
    const allVariables = {
        APP_NAME: getAppName(),
        BASE_URL: getBaseUrl(),
        YEAR: new Date().getFullYear().toString(),
        ...variables
    };

    // Validate variables
    validateTemplateVariables(template, allVariables);

    // Load and process template
    const htmlTemplate = await loadTemplate(template);
    const html = replaceTemplateVariables(htmlTemplate, allVariables);
    const text = generatePlainText(htmlTemplate, allVariables);

    // Email options
    const mailOptions = {
        from: `"${getSenderName()}" <${getSenderEmail()}>`,
        to,
        subject,
        html,
        text
    };

    // Send email
    const result = await transporter.sendMail(mailOptions);

    // Log preview URL for development
    if (getNodeEnv() !== 'production') {
        console.log('Preview URL: %s', nodemailer.getTestMessageUrl(result));
    }
}

/**
 * Send email verification - NOW USING sendCustomEmail
 */
export async function sendVerificationEmail(email: string, firstName: string, token: string): Promise<void> {
    const verificationUrl = `${getBaseUrl()}/api/v1/account/verify-email?token=${token}`;

    await sendCustomEmail(
        email,
        `Verify your email address for ${getAppName()}`,
        EmailTemplate.EMAIL_VERIFICATION,
        {
            FIRST_NAME: firstName,
            VERIFICATION_URL: verificationUrl
        }
    );
}

/**
 * Send password reset email - NOW USING sendCustomEmail
 */
export async function sendPasswordResetEmail(email: string, firstName: string, token: string): Promise<void> {
    const resetUrl = `${getBaseUrl()}/reset-password?token=${token}`;

    await sendCustomEmail(
        email,
        `Reset your password for ${getAppName()}`,
        EmailTemplate.PASSWORD_RESET,
        {
            FIRST_NAME: firstName,
            RESET_URL: resetUrl
        }
    );
}

/**
 * Send password changed notification - NOW USING sendCustomEmail
 */
export async function sendPasswordChangedNotification(email: string, firstName: string): Promise<void> {
    const now = new Date();

    await sendCustomEmail(
        email,
        `Your password was changed on ${getAppName()}`,
        EmailTemplate.PASSWORD_CHANGED,
        {
            FIRST_NAME: firstName,
            DATE: now.toLocaleDateString(),
            TIME: now.toLocaleTimeString()
        }
    );
}

/**
 * Send successful login notification - NOW USING sendCustomEmail
 */
export async function sendLoginNotification(email: string, firstName: string, ipAddress: string, device: string): Promise<void> {
    const now = new Date();

    await sendCustomEmail(
        email,
        `New login detected on ${getAppName()}`,
        EmailTemplate.LOGIN_NOTIFICATION,
        {
            FIRST_NAME: firstName,
            LOGIN_TIME: now.toLocaleString(),
            IP_ADDRESS: ipAddress,
            DEVICE: device
        }
    );
}

/**
 * Send two-factor authentication enabled notification - NOW USING sendCustomEmail
 */
export async function sendTwoFactorEnabledNotification(email: string, firstName: string): Promise<void> {
    const now = new Date();

    await sendCustomEmail(
        email,
        `Two-factor authentication enabled on ${getAppName()}`,
        EmailTemplate.TWO_FACTOR_ENABLED,
        {
            FIRST_NAME: firstName,
            DATE: now.toLocaleDateString()
        }
    );
}

/**
 * Send bulk emails with rate limiting and type safety
 */
export async function sendBulkEmails(
    emails: Array<{
        to: string;
        subject: string;
        template: EmailTemplate;
        variables: Record<string, string>;
    }>,
    options: {
        batchSize?: number;
        delayBetweenBatches?: number;
    } = {}
): Promise<void> {
    const { batchSize = 10, delayBetweenBatches = 1000 } = options;

    // Process emails in batches to avoid overwhelming the SMTP server
    for (let i = 0; i < emails.length; i += batchSize) {
        const batch = emails.slice(i, i + batchSize);

        // Send batch in parallel
        const promises = batch.map(email =>
            sendCustomEmail(email.to, email.subject, email.template, email.variables)
        );

        try {
            await Promise.all(promises);
            console.log(`Sent batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(emails.length / batchSize)}`);
        } catch (error) {
            console.error(`Failed to send batch ${Math.floor(i / batchSize) + 1}:`, error);
            // Continue with next batch
        }

        // Wait between batches (except for the last batch)
        if (i + batchSize < emails.length) {
            await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
        }
    }
}

/**
 * Test email configuration
 */
export async function testEmailConfiguration(): Promise<boolean> {
    try {
        await createTransporter();
        console.log('✅ Email configuration test passed');
        return true;
    } catch (error) {
        console.error('❌ Email configuration test failed:', error);
        return false;
    }
}

/**
 * Send test email
 */
export async function sendTestEmail(to: string): Promise<void> {
    await sendCustomEmail(
        to,
        `Test Email from ${getAppName()}`,
        EmailTemplate.EMAIL_VERIFICATION, // Reuse verification template for testing
        {
            FIRST_NAME: 'Test User',
            VERIFICATION_URL: `${getBaseUrl()}/test`
        }
    );
}

/**
 * Clear template cache (useful for development)
 */
export function clearTemplateCache(): void {
    templateCache.clear();
    console.log('Email template cache cleared');
}

/**
 * Validate email template exists
 */
export async function validateTemplate(template: EmailTemplate): Promise<boolean> {
    try {
        await loadTemplate(template);
        return true;
    } catch {
        return false;
    }
}

/**
 * Validate template by string name (with type checking)
 */
export async function validateTemplateByName(templateName: string): Promise<boolean> {
    if (!isValidTemplate(templateName)) {
        return false;
    }
    return validateTemplate(templateName);
}

/**
 * Get available email templates
 */
export async function getAvailableTemplates(): Promise<EmailTemplate[]> {
    try {
        const templatesDir = path.join(process.cwd(), 'src', 'feature', 'email', 'templates');
        const files = await fs.readdir(templatesDir);

        // Filter and validate template files
        const availableTemplates: EmailTemplate[] = [];

        for (const file of files) {
            if (file.endsWith('.html')) {
                const templateName = file.replace('.html', '');
                if (isValidTemplate(templateName)) {
                    availableTemplates.push(templateName);
                }
            }
        }

        return availableTemplates;
    } catch (error) {
        console.error('Failed to read templates directory:', error);
        return [];
    }
}

/**
 * Get template information
 */
export function getTemplateInfo(template: EmailTemplate) {
    return getTemplateMetadata(template);
}

/**
 * List all templates with their metadata
 */
export function listAllTemplates() {
    return Object.values(EmailTemplate).map(template => ({
        template,
        ...getTemplateMetadata(template)
    }));
}