import path from "node:path";
import fs from "node:fs";
import { GetSecretValueCommand, SecretsManagerClient } from "@aws-sdk/client-secrets-manager";
import { STSClient, GetCallerIdentityCommand } from "@aws-sdk/client-sts";
import { fromNodeProviderChain } from "@aws-sdk/credential-providers";

/**
 * Production secrets loader (runtime)
 *
 * Why this file exists:
 * - `load-secrets.mts` is TypeScript and requires a TS runtime (e.g. `tsx`).
 * - In production Docker images we want to avoid bundling TS runtimes.
 *
 * What it does:
 * - Pulls a JSON secret from AWS Secrets Manager
 * - Writes env files for:
 *   - Backend runtime: /app/.env (Nest ConfigModule reads this when NODE_ENV=production)
 *   - Prisma migrations: /app/packages/database/.env (DATABASE_URL only)
 *
 * This works on:
 * - ECS/Fargate (task role)
 * - EC2 (instance role / IMDS)
 */

/**
 * @typedef {Record<string, string>} SecretsRecord
 */

/**
 * @param {unknown} value
 * @returns {value is Record<string, unknown>}
 */
function isPlainRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * @param {unknown} value
 * @returns {string}
 */
function stringifyEnvValue(value) {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (typeof value === "boolean") return value ? "true" : "false";
  if (value === null || value === undefined) return "";
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

/**
 * @param {string} secretString
 * @returns {SecretsRecord}
 */
function parseSecretsJson(secretString) {
  /** @type {unknown} */
  const parsed = JSON.parse(secretString);
  if (!isPlainRecord(parsed)) {
    throw new Error("SecretsManager SecretString must be a JSON object");
  }

  /** @type {SecretsRecord} */
  const out = {};
  for (const [key, rawValue] of Object.entries(parsed)) {
    out[key] = stringifyEnvValue(rawValue);
  }
  return out;
}

/**
 * @param {string} envPath
 * @param {SecretsRecord} envVars
 * @returns {void}
 */
function writeEnvFile(envPath, envVars) {
  const envContent = Object.entries(envVars)
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");

  fs.writeFileSync(envPath, `${envContent}\n`, "utf8");
}

/**
 * @param {string} awsRegion
 * @param {number} [retryCount]
 * @param {number} [maxRetries]
 * @param {number} [retryDelayMs]
 * @returns {Promise<void>}
 */
async function waitForAwsCredentials(
  awsRegion,
  retryCount = 0,
  maxRetries = 5,
  retryDelayMs = 5000
) {
  const credentials = fromNodeProviderChain();
  const stsClient = new STSClient({ region: awsRegion, credentials });

  try {
    const identity = await stsClient.send(new GetCallerIdentityCommand({}));
    console.log("AWS identity available:", {
      account: identity.Account,
      arn: identity.Arn,
      userId: identity.UserId,
    });
  } catch (error) {
    console.log("Waiting for AWS credentials...", error);
    if (retryCount < maxRetries) {
      console.log(`Retrying in ${retryDelayMs}ms... (Attempt ${retryCount + 1}/${maxRetries})`);
      await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
      return waitForAwsCredentials(awsRegion, retryCount + 1, maxRetries, retryDelayMs);
    }
    throw new Error("Failed to obtain AWS credentials after all retries");
  }
}

/**
 * @param {string} awsRegion
 * @param {string} secretId
 * @param {number} [retryCount]
 * @param {number} [maxRetries]
 * @param {number} [retryDelayMs]
 * @returns {Promise<void>}
 */
async function loadSecrets(
  awsRegion,
  secretId,
  retryCount = 0,
  maxRetries = 5,
  retryDelayMs = 5000
) {
  try {
    console.log("Loading secrets from AWS Secrets Manager", { awsRegion, secretId });
    await waitForAwsCredentials(awsRegion);

    const credentials = fromNodeProviderChain();
    const client = new SecretsManagerClient({ region: awsRegion, credentials });

    const secretResponse = await client.send(new GetSecretValueCommand({ SecretId: secretId }));
    const secretString = secretResponse.SecretString;
    if (!secretString) {
      throw new Error(`SecretString is empty for SecretId "${secretId}"`);
    }

    const secretsMap = parseSecretsJson(secretString);
    console.log("Secrets keys retrieved:", Object.keys(secretsMap));

    const databaseUrl = secretsMap.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error("DATABASE_URL not found in secrets");
    }

    // Nest production config reads ".env" from the current working directory.
    // In our Docker runtime, that is /app, so we must write /app/.env.
    const backendEnvPath = path.resolve(process.cwd(), ".env");
    writeEnvFile(backendEnvPath, secretsMap);
    console.log(`Saved backend env file: ${backendEnvPath}`);

    const prismaEnvPath = path.resolve(process.cwd(), "packages/database/.env");
    writeEnvFile(prismaEnvPath, { DATABASE_URL: databaseUrl });
    console.log(`Saved prisma env file: ${prismaEnvPath}`);
  } catch (error) {
    console.error("Error loading secrets", error);
    if (retryCount < maxRetries) {
      console.log(`Retrying in ${retryDelayMs}ms... (Attempt ${retryCount + 1}/${maxRetries})`);
      await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
      return loadSecrets(awsRegion, secretId, retryCount + 1, maxRetries, retryDelayMs);
    }
    throw error;
  }
}

const nodeEnv = process.env.NODE_ENV;
console.log("NODE_ENV", nodeEnv);

// Keep legacy behavior: do nothing when explicitly running in local mode.
if (nodeEnv === "local") {
  console.log("Not loading secrets in local environment");
  process.exit(0);
}

const awsRegion = process.env.AWS_REGION ?? "us-east-1";
const secretId = process.env.AWS_SECRETS_ID ?? "oppskills-env";

loadSecrets(awsRegion, secretId).catch((error) => {
  console.error("Failed to load secrets after all retries:", error);
  process.exit(1);
});


