import path from 'path';
import fs from 'fs';
import { GetSecretValueCommand, SecretsManagerClient } from '@aws-sdk/client-secrets-manager';
import { STSClient, GetCallerIdentityCommand } from '@aws-sdk/client-sts';
import { fromContainerMetadata } from '@aws-sdk/credential-providers';

console.log('NODE_ENV', process.env.NODE_ENV);
if (process.env.NODE_ENV === 'local') {
    console.log('Not loading secrets in non-production environment');
    process.exit(0);
}

async function waitForIAMCredentials(retryCount = 0, maxRetries = 5, retryDelay = 5000) {
    const stsClient = new STSClient({
        region: process.env.AWS_REGION || 'us-east-1',
        credentials: fromContainerMetadata(),
    });

    try {
        const identity = await stsClient.send(new GetCallerIdentityCommand({}));
        console.log('IAM Role Assumed:', identity);
        return;
    } catch (error) {
        console.log('Waiting for IAM credentials...', error);
        if (retryCount < maxRetries) {
            console.log(`Retrying in ${retryDelay}ms... (Attempt ${retryCount + 1}/${maxRetries})`);
            await new Promise((resolve) => setTimeout(resolve, retryDelay));
            return waitForIAMCredentials(retryCount + 1, maxRetries, retryDelay);
        }
        throw new Error('Failed to assume IAM role after all retries');
    }
}

async function loadSecrets(retryCount = 0, maxRetries = 5, retryDelay = 5000) {
    try {
        console.log('Loading secrets for production environment');
        await waitForIAMCredentials();

        const client = new SecretsManagerClient({
            region: process.env.AWS_REGION || 'us-east-1',
            credentials: fromContainerMetadata(),
        });

        const secretResponse = await client.send(new GetSecretValueCommand({ SecretId: 'oppskills-env' }));
        const secretsMap = JSON.parse(secretResponse.SecretString || '{}');

        console.log('Secrets retrieved from AWS:', Object.keys(secretsMap));
        
        if (!secretsMap.DATABASE_URL) {
            throw new Error('DATABASE_URL not found in secrets');
        }

        const envContent = Object.entries(secretsMap)
            .map(([key, value]) => `${key}=${value}`)
            .join('\n');

        const dbEnv = {
            DATABASE_URL: secretsMap.DATABASE_URL,
        };
        const dbEnvContent = Object.entries(dbEnv)
            .map(([key, value]) => `${key}=${value}`)
            .join('\n');

        const envPath = path.resolve(process.cwd(), 'apps/backend/.env');
        fs.writeFileSync(envPath, envContent, 'utf8');
        console.log('Secrets loaded from AWS Secrets Manager and saved to apps/backend/.env file');
        console.log('Backend .env file path:', envPath);
        console.log('Backend env content:', envContent);

        const dbEnvPath = path.resolve(process.cwd(), 'packages/database/.env');
        fs.writeFileSync(dbEnvPath, dbEnvContent, 'utf8');
        console.log('Secrets loaded from AWS Secrets Manager and saved to packages/database/.env file');
        console.log('Database .env file path:', dbEnvPath);
        console.log('Database env content:', dbEnvContent);
    } catch (error) {
        console.error('Error loading secrets', error);
        if (retryCount < maxRetries) {
            console.log(`Retrying in ${retryDelay}ms... (Attempt ${retryCount + 1}/${maxRetries})`);
            await new Promise((resolve) => setTimeout(resolve, retryDelay));
            return loadSecrets(retryCount + 1, maxRetries, retryDelay);
        }
        throw error;
    }
}

loadSecrets().catch((error) => {
    console.error('Failed to load secrets after all retries:', error);
    process.exit(1);
});
