import { Resend } from 'resend';
import { Logger } from './logger';

const logger = new Logger('ResendUtils');

/**
 * Returns a fresh or cached Resend instance.
 * Using a getter ensures we read the API key ONLY when needed,
 * avoiding issues where the key is read before ConfigModule loads the .env file.
 */
let _resend: Resend | null = null;

export const getResend = (): Resend => {
    const apiKey = process.env.RESEND_API_KEY;

    if (!_resend) {
        if (!apiKey) {
            logger.warn('RESEND_API_KEY is missing during initialization.');
        }
        _resend = new Resend(apiKey || 're_missing_key');
    }

    return _resend;
};

/**
 * Helper to check if the email service is fully configured
 */
export const isResendConfigured = (): boolean => {
    const apiKey = process.env.RESEND_API_KEY;
    return !!apiKey && apiKey.startsWith('re_');
};
