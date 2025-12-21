import path from "node:path";
import fs from "node:fs";
import {
  GetSecretValueCommand,
  SecretsManagerClient,
} from "@aws-sdk/client-secrets-manager";
import { STSClient, GetCallerIdentityCommand } from "@aws-sdk/client-sts";
import { fromNodeProviderChain } from "@aws-sdk/credential-providers";

/**
 * Production secrets loader
 *
 * - Pulls a JSON secret from AWS Secrets Manager
 * - Writes env files for:
 *   - Backend runtime: /app/.env (Nest ConfigModule reads this when NODE_ENV=production)
 *   - Prisma migrations: /app/packages/database/.env (DATABASE_URL only)
 *
 * This must work on both:
 * - ECS/Fargate (task role)
 * - EC2 (instance role / IMDS)
 */

const nodeEnv: string | undefined = process.env.NODE_ENV;
console.log("NODE_ENV", nodeEnv);

// Keep legacy behavior: do nothing when explicitly running in local mode.
if (nodeEnv === "local") {
  console.log("Not loading secrets in local environment");
  process.exit(0);
}

const awsRegion: string = process.env.AWS_REGION ?? "us-east-1";
const secretId: string = process.env.AWS_SECRETS_ID ?? "oppskills-env";

type SecretsRecord = Record<string, string>;

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringifyEnvValue(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (typeof value === "boolean") return value ? "true" : "false";
  if (value === null || value === undefined) return "";
  // Fall back to JSON for nested structures (rare but safe)
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function parseSecretsJson(secretString: string): SecretsRecord {
  const parsed: unknown = JSON.parse(secretString);
  if (!isPlainRecord(parsed)) {
    throw new Error("SecretsManager SecretString must be a JSON object");
  }

  const out: SecretsRecord = {};
  for (const [key, rawValue] of Object.entries(parsed)) {
    out[key] = stringifyEnvValue(rawValue);
  }
  return out;
}

function writeEnvFile(envPath: string, envVars: SecretsRecord): void {
  const envContent: string = Object.entries(envVars)
    .map(([key, value]) => {
      // Wrap values in quotes and escape internal quotes to handle multi-line secrets (like Private Keys)
      const escapedValue = value.replace(/"/g, '\\"');
      return `${key}="${escapedValue}"`;
    })
    .join("\n");

  fs.writeFileSync(envPath, `${envContent}\n`, "utf8");
}

async function waitForAwsCredentials(
  retryCount: number = 0,
  maxRetries: number = 5,
  retryDelayMs: number = 5000
): Promise<void> {
  // Use the standard AWS SDK credential chain (supports ECS task roles + EC2 instance roles).
  const credentials = fromNodeProviderChain();
  const stsClient = new STSClient({ region: awsRegion, credentials });

  try {
    const identity = await stsClient.send(new GetCallerIdentityCommand({}));
    console.log("AWS identity available:", {
      account: identity.Account,
      arn: identity.Arn,
      userId: identity.UserId,
    });
  } catch (error: unknown) {
    console.log("Waiting for AWS credentials...", error);
    if (retryCount < maxRetries) {
      console.log(
        `Retrying in ${retryDelayMs}ms... (Attempt ${retryCount + 1}/${maxRetries})`
      );
      await new Promise<void>((resolve) => setTimeout(resolve, retryDelayMs));
      return waitForAwsCredentials(retryCount + 1, maxRetries, retryDelayMs);
    }
    throw new Error("Failed to obtain AWS credentials after all retries");
  }
}

async function loadSecrets(
  retryCount: number = 0,
  maxRetries: number = 5,
  retryDelayMs: number = 5000
): Promise<void> {
  try {
    console.log("Loading secrets from AWS Secrets Manager", {
      awsRegion,
      secretId,
    });
    await waitForAwsCredentials();

    const credentials = fromNodeProviderChain();
    const client = new SecretsManagerClient({ region: awsRegion, credentials });

    const secretResponse = await client.send(
      new GetSecretValueCommand({ SecretId: secretId })
    );
    const secretString: string | undefined = secretResponse.SecretString;
    if (!secretString) {
      throw new Error(`SecretString is empty for SecretId "${secretId}"`);
    }

    const secretsMap: SecretsRecord = parseSecretsJson(secretString);
    console.log("Secrets keys retrieved:", Object.keys(secretsMap));

    const databaseUrl: string | undefined = secretsMap.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error("DATABASE_URL not found in secrets");
    }

    // IMPORTANT:
    // Nest production config reads ".env" from the current working directory.
    // In our Docker runtime, that is /app, so we must write /app/.env.
    const backendEnvPath: string = path.resolve(process.cwd(), ".env");
    writeEnvFile(backendEnvPath, secretsMap);
    console.log(`Saved backend env file: ${backendEnvPath}`);

    const prismaEnvPath: string = path.resolve(
      process.cwd(),
      "packages/database/.env"
    );
    writeEnvFile(prismaEnvPath, { DATABASE_URL: databaseUrl });
    console.log(`Saved prisma env file: ${prismaEnvPath}`);
  } catch (error: unknown) {
    console.error("Error loading secrets", error);
    if (retryCount < maxRetries) {
      console.log(
        `Retrying in ${retryDelayMs}ms... (Attempt ${retryCount + 1}/${maxRetries})`
      );
      await new Promise<void>((resolve) => setTimeout(resolve, retryDelayMs));
      return loadSecrets(retryCount + 1, maxRetries, retryDelayMs);
    }
    throw error;
  }
}

loadSecrets().catch((error: unknown) => {
  console.error("Failed to load secrets after all retries:", error);
  process.exit(1);
});
