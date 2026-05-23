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
  // 1. Return cached instance if it exists (Efficiency)
  if (_resend) return _resend;

  // 2. Lookup key ONLY if cache is empty
  const apiKey = process.env.RESEND_API_KEY;

  if (apiKey && apiKey.startsWith('re_')) {
    // 3. Only poison the cache with a VALID key
    _resend = new Resend(apiKey);
    return _resend;
  }

  // 4. If key is missing/invalid, return a temporary instance
  // but DON'T cache it. This allows "healing" on the next call.
  logger.warn(
    'RESEND_API_KEY is missing or invalid. Returning temporary instance.',
  );
  return new Resend('re_missing_key');
};

/**
 * Helper to check if the email service is fully configured
 */
export const isResendConfigured = (): boolean => {
  // If we have a cached instance, we are definitely configured
  if (_resend) return true;

  const apiKey = process.env.RESEND_API_KEY;
  return !!apiKey && apiKey.startsWith('re_');
};
