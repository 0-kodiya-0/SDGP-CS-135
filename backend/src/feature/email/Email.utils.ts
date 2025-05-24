import { EmailTemplate, EmailTemplateMetadata, EMAIL_TEMPLATE_METADATA } from "./Email.types";

/**
 * Get template metadata by template enum
 */
export function getTemplateMetadata(template: EmailTemplate): EmailTemplateMetadata {
    return EMAIL_TEMPLATE_METADATA[template];
}

/**
 * Get all available template names
 */
export function getAllTemplateNames(): EmailTemplate[] {
    return Object.values(EmailTemplate);
}

/**
 * Validate if a string is a valid template name
 */
export function isValidTemplate(templateName: string): templateName is EmailTemplate {
    return Object.values(EmailTemplate).includes(templateName as EmailTemplate);
}

/**
 * Get template file path
 */
export function getTemplateFilePath(template: EmailTemplate): string {
    return `${template}.html`;
}