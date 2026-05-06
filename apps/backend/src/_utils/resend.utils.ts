import { Resend } from 'resend';
import { Logger } from './logger';

const logger = new Logger('ResendUtils');
const apiKey = process.env.RESEND_API_KEY;

if (!apiKey) {
    logger.warn('RESEND_API_KEY is missing. Emails will not be sent.');
}

/**
 * Robust Resend instance.
 * Note: If RESEND_API_KEY is missing, calls to resend.emails.send() 
 * will throw an error from the SDK. The processor handles this via try/catch.
 */
export const resend = new Resend(apiKey || 're_missing_key');

/**
 * Helper to check if the email service is fully configured
 */
export const isResendConfigured = (): boolean => {
    return !!apiKey && apiKey.startsWith('re_');
};
