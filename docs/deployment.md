# Deployment Documentation

This document provides comprehensive guidance for deploying the OppSkills platform to production and managing deployments across different environments.

## Table of Contents

1. [Deployment Overview](#deployment-overview)
2. [Architecture](#architecture)
3. [Local Development Setup](#local-development-setup)
4. [Production Infrastructure](#production-infrastructure)
5. [Backend Deployment](#backend-deployment)
6. [Frontend Deployment](#frontend-deployment)
7. [CI/CD Pipelines](#cicd-pipelines)
8. [Environment Variables](#environment-variables)
9. [Database Migrations](#database-migrations)
10. [Secrets Management](#secrets-management)
11. [Monitoring and Logging](#monitoring-and-logging)
12. [Troubleshooting](#troubleshooting)

## Deployment Overview

OppSkills uses a hybrid deployment architecture:

- **Backend (NestJS API)**: Deployed to AWS EC2 using Docker containers
- **Frontend (Next.js)**: Deployed to Vercel
- **Database**: AWS RDS PostgreSQL
- **Cache**: AWS ElastiCache Redis
- **Media Storage**: AWS S3 + CloudFront CDN
- **Container Registry**: AWS ECR (Elastic Container Registry)

### Deployment Flow

```
Code Push → GitHub → GitHub Actions → Build → Deploy
                                         ↓
                                    AWS ECR (Backend)
                                         ↓
                                    AWS EC2 (Backend)

                                    Vercel (Frontend)
```

## Architecture

### Infrastructure Components

#### AWS Services

- **EC2 Instance**: Hosts the backend Docker container
  - Region: `us-east-1`
  - Instance role with permissions for ECR, Secrets Manager, S3
  - Docker and AWS CLI installed

- **RDS PostgreSQL**: Production database
  - Schema: `oppskills`
  - Managed database service
  - Automated backups enabled

- **ElastiCache Redis**: Session and cache storage
  - Used for caching layer in backend
  - Default port: 6379

- **ECR (Elastic Container Registry)**: Docker image storage
  - Registry: `443512646680.dkr.ecr.us-east-1.amazonaws.com`
  - Repository: `oppskills-core`

- **S3 + CloudFront**: Media asset storage and delivery
  - Bucket: `oppskills-assets`
  - Private bucket with CloudFront OAC (Origin Access Control)
  - CORS configured for direct browser uploads

- **Secrets Manager**: Stores production secrets
  - Secret ID: `oppskills-env`
  - Contains all environment variables as JSON

#### Vercel

- **Frontend Hosting**: Next.js app deployment
- **Preview Deployments**: Automatic for all branches
- **Production Deployment**: Triggered on main branch push

## Local Development Setup

### Prerequisites

1. **Node.js 22+** with pnpm package manager
2. **Docker Desktop** for local infrastructure
3. **Git** for version control

### Step-by-Step Setup

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd oppskills-core
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Set up environment files**

   Create `apps/backend/.env.local`:

   ```env
   # Database (use local Docker PostgreSQL)
   DATABASE_URL="postgresql://oppskills:yourpassword@localhost:5434/oppskills?schema=oppskills"

   # Clerk Authentication
   CLERK_SECRET_KEY=sk_test_...
   CLERK_WEBHOOK_SECRET=whsec_...

   # Redis (local Docker)
   REDISHOST=localhost
   REDISPORT=6380
   REDISPASSWORD=yourpassword

   # Admin Users (comma-separated Clerk user IDs)
   ADMIN_USER_IDS=user_xxx,user_yyy

   # Development bypass (local only)
   AUTH_BYPASS=true

   # AWS S3 (optional for local, can use production values)
   AWS_REGION=us-east-1
   MEDIA_S3_BUCKET=oppskills-assets-dev
   MEDIA_CLOUDFRONT_BASE_URL=https://assets-dev.oppskills.com
   ```

   Create `apps/ui-webapp/.env.local`:

   ```env
   # Clerk Authentication
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
   CLERK_SECRET_KEY=sk_test_...

   # Backend API URL
   NEXT_PUBLIC_API_URL=http://localhost:3001
   ```

   Create `packages/database/.env`:

   ```env
   DATABASE_URL="postgresql://oppskills:yourpassword@localhost:5434/oppskills?schema=oppskills"
   ```

4. **Start local infrastructure**

   Note: There is no `docker-compose.yml` in the repository. You'll need to manually run PostgreSQL and Redis:

   ```bash
   # PostgreSQL
   docker run -d \
     --name oppskills-postgres \
     -e POSTGRES_USER=oppskills \
     -e POSTGRES_PASSWORD=yourpassword \
     -e POSTGRES_DB=oppskills \
     -p 5434:5432 \
     postgres:15-alpine

   # Redis
   docker run -d \
     --name oppskills-redis \
     -e REDIS_PASSWORD=yourpassword \
     -p 6380:6379 \
     redis:7-alpine \
     redis-server --requirepass yourpassword
   ```

5. **Generate Prisma client and apply schema**

   ```bash
   pnpm db:generate
   pnpm db:push
   ```

6. **Start development servers**

   ```bash
   # All services
   pnpm dev

   # Or individually
   pnpm dev:backend    # Backend on http://localhost:3001
   pnpm dev:ui-webapp  # Frontend on http://localhost:3000
   ```

7. **(Optional) Start Prisma Studio**
   ```bash
   pnpm db:studio  # Opens on http://localhost:3008
   ```

### Local Webhook Testing

To test Clerk webhooks locally:

```bash
# Install svix CLI
npm install -g svix-cli

# Listen to webhooks
svix listen http://localhost:3001/user-accounts/clerk-webhook
```

## Production Infrastructure

### AWS Resources

#### 1. EC2 Instance Setup

**Requirements:**

- Docker installed
- AWS CLI installed
- Instance IAM role attached

**Instance IAM Role Permissions:**

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ecr:GetAuthorizationToken",
        "ecr:BatchCheckLayerAvailability",
        "ecr:GetDownloadUrlForLayer",
        "ecr:BatchGetImage"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": ["secretsmanager:GetSecretValue"],
      "Resource": "arn:aws:secretsmanager:us-east-1:*:secret:oppskills-env-*"
    },
    {
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:GetObject", "s3:DeleteObject"],
      "Resource": "arn:aws:s3:::oppskills-assets/*"
    }
  ]
}
```

**Docker Access:**
The SSH user must have Docker access. Choose one:

- Add user to docker group: `sudo usermod -aG docker <user>`
- Allow NOPASSWD sudo for docker commands
- Use a different SSH user with Docker access

#### 2. RDS PostgreSQL

**Configuration:**

- Engine: PostgreSQL 15+
- Instance class: Based on workload (e.g., db.t3.medium)
- Storage: General Purpose SSD (gp3)
- Schema: `oppskills`
- Security group: Allow access from EC2 instance

**Connection:**

- Connection string stored in AWS Secrets Manager
- Format: `postgresql://user:password@endpoint:5432/database?schema=oppskills`

#### 3. ElastiCache Redis

**Configuration:**

- Engine: Redis 7+
- Node type: Based on workload (e.g., cache.t3.micro)
- Security group: Allow access from EC2 instance

**Connection:**

- Host, port, and password stored in AWS Secrets Manager

#### 4. S3 + CloudFront

**S3 Bucket Configuration:**

- Bucket name: `oppskills-assets`
- Region: `us-east-1`
- Block Public Access: **ENABLED** (all checks)
- Encryption: SSE-S3 (AES-256)

**CORS Configuration:**

```json
[
  {
    "AllowedOrigins": [
      "https://oppskills.com",
      "https://www.oppskills.com",
      "https://app.oppskills.com"
    ],
    "AllowedMethods": ["POST", "PUT", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag", "x-amz-request-id"],
    "MaxAgeSeconds": 3000
  }
]
```

**CloudFront Distribution:**

- Origin: S3 bucket with OAC (Origin Access Control)
- Viewer protocol: Redirect HTTP to HTTPS
- Allowed methods: GET, HEAD
- Cache policy: CachingOptimized
- Compress objects: Enabled
- Custom domain: `assets.oppskills.com` (optional)

For detailed S3/CloudFront setup, see: `/Users/harshit/Documents/freelance/oppskills-core/deploy/aws-media-s3-cloudfront.md`

## Backend Deployment

### Docker Image Build

The backend uses a multi-stage Dockerfile for production builds:

**File:** `apps/backend/Dockerfile.prod`

**Build stages:**

1. **base**: Node.js 22 Alpine with pnpm
2. **deps**: Install dependencies
3. **build**: Build backend + workspace dependencies (types, database)
4. **runner**: Production runtime

**Build context:** Repository root

### Deployment Process

#### Automatic Deployment

Triggered on push to `main` branch when backend-related files change:

- `apps/backend/**`
- `packages/**`
- `scripts/load-secrets.mjs`
- Build configuration files

**Workflow:** `.github/workflows/deploy-backend-ec2.yml`

**Steps:**

1. Build Docker image
2. Tag with Git SHA and `latest`
3. Push to ECR
4. SSH to EC2 instance
5. Pull new image
6. Stop and remove old container
7. Start new container with environment variables

#### Manual Deployment

Trigger via GitHub Actions UI (workflow_dispatch):

- Option to specify custom image tag
- Option to run migrations on deployment

### Container Runtime

**Entrypoint:** `apps/backend/docker-entrypoint.sh`

**Startup sequence:**

1. Load secrets from AWS Secrets Manager (via `scripts/load-secrets.mjs`)
   - Writes `/app/.env` (Nest + Prisma; includes `DATABASE_URL`)
   - Removes legacy `/app/packages/database/.env` if present (avoids Prisma 6 duplicate-`DATABASE_URL` errors)
2. Optionally run Prisma migrations (`RUN_MIGRATIONS=true`)
3. Start NestJS backend: `node apps/backend/dist/main.js`

**Container configuration:**

- Port: 3001
- Restart policy: `unless-stopped`
- Environment variables:
  - `NODE_ENV=production`
  - `PORT=3001`
  - `AWS_REGION=us-east-1`
  - `AWS_SECRETS_ID=oppskills-env`
  - `RUN_SECRETS_LOADER=true`
  - `RUN_MIGRATIONS=false` (default)

### Local Docker Build

Test the production Docker image locally:

```bash
# Build from repository root
docker build -f apps/backend/Dockerfile.prod -t oppskills-backend:local .

# Run locally (requires .env file or AWS credentials)
docker run --rm -p 3001:3001 \
  -e NODE_ENV=production \
  -e RUN_SECRETS_LOADER=false \
  --env-file apps/backend/.env.local \
  oppskills-backend:local
```

## Frontend Deployment

### Vercel Configuration

**File:** `vercel.json`

```json
{
  "buildCommand": "pnpm build",
  "installCommand": "pnpm install"
}
```

### Deployment Triggers

#### Automatic Production Deployment

- Trigger: Push to `main` branch
- Workflow: `.github/workflows/deploy-vercel.yml`
- Vercel automatically deploys via GitHub integration

#### Preview Deployments

- Vercel creates preview deployments for all pull requests
- Unique URL for each deployment

### Deployment Workflow

**Workflow:** `.github/workflows/deploy-vercel.yml`

**Purpose:** Updates deployment log file to track deployments

**Steps:**

1. Checkout sparse (only `.verceldeployments` file)
2. Append deployment timestamp
3. Commit and push
4. Vercel detects push and triggers deployment

**Note:** The actual deployment is handled by Vercel's GitHub integration, not GitHub Actions.

### Build Configuration

**Next.js app location:** `apps/ui-webapp`

**Build command:** `pnpm build` (uses Turborepo)

**Build outputs:**

- `.next/**` (except cache)
- Static assets

**Environment variables:** Set in Vercel dashboard

## CI/CD Pipelines

### GitHub Actions Workflows

#### 1. Backend Deployment (`deploy-backend-ec2.yml`)

**Trigger:**

- Push to `main` branch
- Changes in backend-related paths
- Manual trigger (workflow_dispatch)

**Jobs:**

1. **build_and_push**
   - Checkout code
   - Configure AWS credentials
   - Login to ECR
   - Build and push Docker image
   - Tag with Git SHA and `latest`

2. **deploy**
   - SSH to EC2 instance
   - Pull latest image from ECR
   - Replace running container
   - Start new container

**Environment variables:**

```yaml
AWS_REGION: "us-east-1"
ECR_REGISTRY: "443512646680.dkr.ecr.us-east-1.amazonaws.com"
ECR_REPOSITORY: "oppskills-core"
CONTAINER_NAME: "oppskills-backend"
CONTAINER_PORT: "3001"
AWS_SECRETS_ID: "oppskills-env"
RUN_MIGRATIONS: "false"
```

**Concurrency:** `deploy-backend-ec2` group (cancel in progress)

#### 2. Run Migrations (`run-migrations-ec2.yml`)

**Trigger:** Manual only (workflow_dispatch)

**Purpose:** Run Prisma migrations on production database without redeploying

**Steps:**

1. SSH to EC2 instance
2. Pull specified image (or latest)
3. Run container with migration command only
4. Exit (does not start long-running server)

**Command executed:**

```bash
docker run --rm \
  -e NODE_ENV=production \
  -e AWS_REGION="${AWS_REGION}" \
  -e AWS_SECRETS_ID="${AWS_SECRETS_ID}" \
  --entrypoint sh \
  "${ECR_IMAGE}" \
  -lc "node scripts/load-secrets.mjs && pnpm exec prisma migrate deploy --schema packages/database/prisma"
```

**Concurrency:** `run-migrations-ec2` group (no cancellation)

#### 3. Vercel Deployment (`deploy-vercel.yml`)

**Trigger:**

- Push to `main` branch
- Excludes `.verceldeployments` file changes
- Manual trigger (workflow_dispatch)
- Repository dispatch event

**Job:**

- Update deployment log file
- Commit timestamp to `.verceldeployments`
- Push to main branch

**Note:** Actual deployment handled by Vercel's GitHub integration

### Required GitHub Secrets

Configure in GitHub repository settings: **Settings → Secrets and variables → Actions**

| Secret Name              | Description                                     | Example                               |
| ------------------------ | ----------------------------------------------- | ------------------------------------- |
| `AWS_ACCESS_KEY_ID`      | IAM user access key for GitHub Actions          | `AKIA...`                             |
| `AWS_SECRET_ACCESS_KEY`  | IAM user secret access key                      | `wJalr...`                            |
| `EC2_HOST`               | EC2 instance public hostname or IP              | `ec2-1-2-3-4.compute-1.amazonaws.com` |
| `EC2_USER`               | SSH username for EC2 instance                   | `ec2-user` or `ubuntu`                |
| `EC2_SSH_PRIVATE_KEY`    | SSH private key (PEM format)                    | `-----BEGIN RSA PRIVATE KEY-----...`  |
| `EC2_SSH_PORT`           | SSH port (optional, defaults to 22)             | `22`                                  |
| `OPPSKILLS_CORE_DEV_PAT` | GitHub Personal Access Token for deployment log | `ghp_...`                             |

### IAM User Permissions (GitHub Actions)

The IAM user credentials used by GitHub Actions need:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ecr:GetAuthorizationToken",
        "ecr:BatchCheckLayerAvailability",
        "ecr:GetDownloadUrlForLayer",
        "ecr:PutImage",
        "ecr:InitiateLayerUpload",
        "ecr:UploadLayerPart",
        "ecr:CompleteLayerUpload"
      ],
      "Resource": "*"
    }
  ]
}
```

## Environment Variables

### Backend Environment Variables

#### Required (Production)

Stored in AWS Secrets Manager (`oppskills-env`):

```bash
# Database
DATABASE_URL=postgresql://user:password@rds-endpoint:5432/oppskills?schema=oppskills

# Clerk Authentication
CLERK_SECRET_KEY=sk_live_...
CLERK_WEBHOOK_SECRET=whsec_...

# Redis
REDISHOST=elasticache-endpoint
REDISPORT=6379
REDISPASSWORD=your-redis-password

# Admin Users
ADMIN_USER_IDS=user_xxx,user_yyy

# AWS S3 / CloudFront
AWS_REGION=us-east-1
MEDIA_S3_BUCKET=oppskills-assets
MEDIA_CLOUDFRONT_BASE_URL=https://assets.oppskills.com

# Additional production configs
NODE_ENV=production
PORT=3001
```

#### Development (Local)

File: `apps/backend/.env.local`

```bash
# Database (local Docker)
DATABASE_URL=postgresql://oppskills:yourpassword@localhost:5434/oppskills?schema=oppskills

# Clerk (test keys)
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...

# Redis (local Docker)
REDISHOST=localhost
REDISPORT=6380
REDISPASSWORD=yourpassword

# Admin Users
ADMIN_USER_IDS=user_xxx

# Development bypass
AUTH_BYPASS=true

# AWS (optional, use dev/staging bucket)
AWS_REGION=us-east-1
MEDIA_S3_BUCKET=oppskills-assets-dev
MEDIA_CLOUDFRONT_BASE_URL=https://assets-dev.oppskills.com

# AWS Credentials (for presigning)
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
```

### Frontend Environment Variables

#### Vercel (Production)

Set in Vercel dashboard:

```bash
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...

# Backend API
NEXT_PUBLIC_API_URL=https://api.oppskills.com

# PostHog Analytics (optional)
NEXT_PUBLIC_POSTHOG_KEY=phc_...
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

#### Local Development

File: `apps/ui-webapp/.env.local`

```bash
# Clerk (test keys)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Backend API (local)
NEXT_PUBLIC_API_URL=http://localhost:3001

# PostHog Analytics (optional)
NEXT_PUBLIC_POSTHOG_KEY=phc_...
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

### Database Package

File: `packages/database/.env`

```bash
DATABASE_URL=postgresql://oppskills:yourpassword@localhost:5434/oppskills?schema=oppskills
```

**Note:** In production, this is auto-generated by `scripts/load-secrets.mjs`

## Database Migrations

### Development Workflow

#### Creating a Migration

1. **Modify the Prisma schema**

   ```bash
   # Edit packages/database/prisma/schema.prisma
   ```

2. **Generate Prisma client**

   ```bash
   pnpm db:generate
   ```

3. **Create and apply migration**

   ```bash
   # Creates migration file and applies to database
   pnpm db:migrate

   # You'll be prompted to name the migration
   # Example: add_user_profile_fields
   ```

4. **Rebuild database package**
   ```bash
   pnpm build --filter=@oppskills/db
   ```

#### Quick Schema Changes (Development Only)

For rapid prototyping without creating migration files:

```bash
pnpm db:push
```

**Warning:** `db:push` does not create migration files. Only use in development.

### Production Migrations

#### Automatic Migrations (Not Recommended)

Migrations can run automatically on container startup by setting `RUN_MIGRATIONS=true`. However, this is **disabled by default** to prevent issues.

**Why disabled:**

- Failed migrations cause container restart loops
- Cannot easily troubleshoot migration issues
- Risk of P3009 errors (failed migration state)

#### Recommended Approach: Manual Migrations

**Method 1: Use dedicated workflow**

Trigger: `.github/workflows/run-migrations-ec2.yml`

Steps:

1. Go to GitHub Actions
2. Select "Run Prisma migrations on EC2"
3. Click "Run workflow"
4. Optionally specify image tag (defaults to `latest`)

**Method 2: Manual deployment with migrations**

Trigger: `.github/workflows/deploy-backend-ec2.yml`

Steps:

1. Go to GitHub Actions
2. Select "Deploy backend to EC2"
3. Click "Run workflow"
4. Set `run_migrations` to `true`
5. Optionally specify image tag

**Method 3: SSH to EC2 and run manually**

```bash
# SSH to EC2 instance
ssh ec2-user@<ec2-host>

# Run migration in temporary container
docker run --rm \
  -e NODE_ENV=production \
  -e AWS_REGION=us-east-1 \
  -e AWS_SECRETS_ID=oppskills-env \
  --entrypoint sh \
  443512646680.dkr.ecr.us-east-1.amazonaws.com/oppskills-core:latest \
  -lc "node scripts/load-secrets.mjs && pnpm exec prisma migrate deploy --schema packages/database/prisma"
```

### Migration Files

**Location:** `packages/database/prisma/migrations/`

**Format:**

```
20251106112805_oppskills/
  migration.sql
```

**Generated by:** `prisma migrate dev`

**Applied by:** `prisma migrate deploy` (production)

### Prisma Studio

View and edit database records:

```bash
# Local development
pnpm db:studio
# Opens http://localhost:3008

# Production (via SSH tunnel)
ssh -L 5432:rds-endpoint:5432 ec2-user@<ec2-host>
# Then run Prisma Studio locally with production DATABASE_URL
```

## Secrets Management

### AWS Secrets Manager

**Secret ID:** `oppskills-env`

**Region:** `us-east-1`

**Format:** JSON key-value pairs

**Example structure:**

```json
{
  "DATABASE_URL": "postgresql://...",
  "CLERK_SECRET_KEY": "sk_live_...",
  "CLERK_WEBHOOK_SECRET": "whsec_...",
  "REDISHOST": "elasticache-endpoint",
  "REDISPORT": "6379",
  "REDISPASSWORD": "...",
  "ADMIN_USER_IDS": "user_xxx,user_yyy",
  "AWS_REGION": "us-east-1",
  "MEDIA_S3_BUCKET": "oppskills-assets",
  "MEDIA_CLOUDFRONT_BASE_URL": "https://assets.oppskills.com"
}
```

### Secrets Loader

**File:** `scripts/load-secrets.mjs`

**Purpose:** Fetch secrets from AWS Secrets Manager and write to `.env` files

**How it works:**

1. Checks `NODE_ENV` (skips if `local`)
2. Uses AWS SDK with IAM role credentials (EC2/ECS)
3. Fetches secret from Secrets Manager
4. Parses JSON
5. Writes `/app/.env` (all secrets for Nest and Prisma) and deletes `/app/packages/database/.env` if it exists (Prisma 6+ errors when the same key appears in multiple `.env` files).

**Retry logic:**

- Waits for AWS credentials (max 5 retries, 5s delay)
- Retries secret fetch (max 5 retries, 5s delay)

**Usage:**

```bash
# Production (uses IAM role)
NODE_ENV=production node scripts/load-secrets.mjs

# Local (skips loading)
NODE_ENV=local node scripts/load-secrets.mjs
```

### Updating Secrets

**AWS Console:**

1. Go to AWS Secrets Manager
2. Find `oppskills-env`
3. Click "Retrieve secret value"
4. Click "Edit"
5. Update JSON
6. Save

**AWS CLI:**

```bash
aws secretsmanager update-secret \
  --secret-id oppskills-env \
  --secret-string '{"DATABASE_URL":"...","CLERK_SECRET_KEY":"...",...}' \
  --region us-east-1
```

**After updating secrets:**
Restart the backend container to reload:

```bash
# SSH to EC2
ssh ec2-user@<ec2-host>

# Restart container
docker restart oppskills-backend
```

### Local Secrets

**Never commit:**

- `.env.local`
- `.env`
- Any file containing secrets

**Gitignore patterns:**

```gitignore
.env
.env.local
.env.*.local
```

## Monitoring and Logging

### Container Logs (Backend)

**View logs on EC2:**

```bash
# SSH to EC2
ssh ec2-user@<ec2-host>

# View container logs
docker logs oppskills-backend

# Follow logs (live tail)
docker logs -f oppskills-backend

# Last 100 lines
docker logs --tail 100 oppskills-backend

# Logs since timestamp
docker logs --since 2024-01-01T00:00:00 oppskills-backend
```

### Container Status

**Check container health:**

```bash
# List running containers
docker ps

# Container stats (CPU, memory)
docker stats oppskills-backend

# Inspect container
docker inspect oppskills-backend
```

### Application Monitoring

#### Backend Health Check

The NestJS backend should expose health check endpoints:

```bash
# Basic health check
curl http://localhost:3001/health

# Database health
curl http://localhost:3001/health/db

# Redis health
curl http://localhost:3001/health/redis
```

#### Vercel Deployment Status

View deployment logs in Vercel dashboard:

- https://vercel.com/[your-team]/oppskills-ui-webapp

### Database Monitoring

**RDS CloudWatch Metrics:**

- CPU Utilization
- Database Connections
- Free Storage Space
- Read/Write IOPS
- Replication Lag (if using replicas)

**Access RDS logs:**

- AWS Console → RDS → Databases → oppskills-db → Logs
- Enable PostgreSQL logs: `log_statement`, `log_duration`

### Redis Monitoring

**ElastiCache CloudWatch Metrics:**

- CPU Utilization
- Network Bytes In/Out
- Cache Hit Rate
- Evictions
- Current Connections

### Recommended Monitoring Tools

**AWS CloudWatch:**

- Set up alarms for critical metrics
- EC2 CPU/Memory utilization
- RDS connection count
- ElastiCache hit rate

**Application Performance Monitoring (APM):**

- Consider: New Relic, Datadog, or AWS X-Ray
- Track API response times
- Monitor error rates
- Database query performance

**Log Aggregation:**

- CloudWatch Logs (native AWS)
- Or third-party: Datadog, Splunk, Elasticsearch

## Troubleshooting

### Backend Deployment Issues

#### Container Won't Start

**Symptom:** Container exits immediately after deployment

**Check:**

```bash
# View logs for errors
docker logs oppskills-backend

# Check container exit code
docker ps -a | grep oppskills-backend
```

**Common causes:**

1. **Secrets loading failed**
   - Verify IAM role has Secrets Manager permissions
   - Check secret ID matches (`oppskills-env`)
   - Verify secret exists in correct region

2. **Database connection failed**
   - Verify DATABASE_URL in secrets
   - Check RDS security group allows EC2 instance
   - Test database connectivity from EC2

3. **Port already in use**
   - Check if old container is still running
   - `docker ps -a` and remove old containers

**Fix:**

```bash
# Remove failed container
docker rm -f oppskills-backend

# Pull latest image
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 443512646680.dkr.ecr.us-east-1.amazonaws.com
docker pull 443512646680.dkr.ecr.us-east-1.amazonaws.com/oppskills-core:latest

# Start container manually with debug
docker run --rm -it \
  -e NODE_ENV=production \
  -e AWS_REGION=us-east-1 \
  -e AWS_SECRETS_ID=oppskills-env \
  -e RUN_SECRETS_LOADER=true \
  -e RUN_MIGRATIONS=false \
  443512646680.dkr.ecr.us-east-1.amazonaws.com/oppskills-core:latest
```

#### SSH Deployment Fails

**Symptom:** GitHub Actions workflow fails during SSH step

**Common causes:**

1. **SSH key permission denied**
   - Verify `EC2_SSH_PRIVATE_KEY` secret is correct
   - Check key matches EC2 instance key pair
   - Verify SSH user has access

2. **Docker permission denied**
   - SSH user not in docker group
   - Fix: `sudo usermod -aG docker <user>` (then re-login)

3. **AWS CLI not found**
   - Install AWS CLI on EC2 instance

#### ECR Push Fails

**Symptom:** Cannot push Docker image to ECR

**Check IAM permissions:**

- GitHub Actions IAM user needs ECR permissions
- Verify `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` secrets

**Fix:**

```bash
# Manually test ECR login
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin 443512646680.dkr.ecr.us-east-1.amazonaws.com
```

### Database Migration Issues

#### P3009: Failed Migration Error

**Full error:**

```
Error: P3009 migrate found failed migrations in the target database
```

**Cause:** A previous migration started but failed, leaving the database in an inconsistent state.

**Diagnosis:**

1. **Connect to database:**

   ```bash
   psql postgresql://user:password@rds-endpoint:5432/oppskills
   ```

2. **Check migrations table:**

   ```sql
   \c oppskills
   SET search_path TO oppskills;
   SELECT * FROM _prisma_migrations WHERE finished_at IS NULL;
   ```

3. **View failed migration:**
   ```sql
   SELECT migration_name, logs, started_at, finished_at, rolled_back_at
   FROM _prisma_migrations
   WHERE migration_name = '20251106112805_oppskills';
   ```

**Resolution:**

**Option 1: Migration didn't apply (safe to roll back)**

```bash
pnpm -C packages/database exec prisma migrate resolve \
  --rolled-back "20251106112805_oppskills" \
  --schema packages/database/prisma
```

**Option 2: Migration partially applied (fix manually)**

1. Manually apply or revert the SQL changes
2. Mark as applied:
   ```bash
   pnpm -C packages/database exec prisma migrate resolve \
     --applied "20251106112805_oppskills" \
     --schema packages/database/prisma
   ```

**After resolution:**
Run migrations again:

```bash
pnpm db:migrate:deploy
```

#### Migration Applied But Not Reflected

**Symptom:** Migration ran successfully but schema changes not visible

**Check:**

1. **Verify Prisma client regenerated:**

   ```bash
   pnpm db:generate
   pnpm build --filter=@oppskills/db
   pnpm build --filter=@oppskills/backend
   ```

2. **Restart backend:**

   ```bash
   docker restart oppskills-backend
   ```

3. **Check correct schema:**
   - PostgreSQL schema is `oppskills`, not `public`
   - Verify `schema.prisma` has `schemas = ["oppskills"]`

### Frontend Deployment Issues

#### Vercel Build Fails

**Symptom:** Vercel deployment shows build errors

**Common causes:**

1. **Type errors**
   - Check TypeScript compilation locally: `pnpm check-types`
   - Fix type errors before pushing

2. **Missing dependencies**
   - Ensure `package.json` includes all dependencies
   - Check `pnpm-lock.yaml` is committed

3. **Environment variables missing**
   - Verify all `NEXT_PUBLIC_*` vars are set in Vercel dashboard

**Debug:**

- View build logs in Vercel dashboard
- Test build locally: `pnpm build:ui-webapp`

#### API Calls Failing from Vercel

**Symptom:** Frontend deployed but API calls return errors

**Check:**

1. **NEXT_PUBLIC_API_URL is correct**
   - Should point to production backend
   - Example: `https://api.oppskills.com`

2. **CORS configured on backend**
   - Backend must allow Vercel domain
   - Check NestJS CORS settings

3. **Authentication issues**
   - Verify Clerk keys match environment
   - Check webhook URLs are updated

### Performance Issues

#### High Database Load

**Symptoms:**

- Slow API responses
- High RDS CPU usage
- Connection pool exhausted

**Diagnosis:**

```sql
-- Find slow queries
SELECT query, calls, total_time, mean_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 20;

-- Check active connections
SELECT count(*) FROM pg_stat_activity;
```

**Solutions:**

- Add database indexes
- Optimize Prisma queries
- Increase RDS instance size
- Implement Redis caching
- Configure connection pooling

#### High Redis Memory Usage

**Symptoms:**

- Redis evictions in CloudWatch
- Cache misses increasing

**Solutions:**

- Review cache TTLs
- Implement cache eviction policy
- Increase ElastiCache node size
- Use Redis memory analyzer

#### Container Memory Issues

**Symptom:** Container OOM (Out of Memory) killed

**Check:**

```bash
# Container resource usage
docker stats oppskills-backend

# Container memory limit
docker inspect oppskills-backend | grep -i memory
```

**Solutions:**

- Increase EC2 instance size
- Set Docker memory limits
- Optimize application memory usage
- Check for memory leaks (heap snapshots)

### Network Issues

#### Cannot Reach Backend API

**Check:**

1. **Container running:**

   ```bash
   docker ps | grep oppskills-backend
   ```

2. **Port binding:**

   ```bash
   docker port oppskills-backend
   netstat -tulpn | grep 3001
   ```

3. **Security group:**
   - EC2 security group allows inbound on port 3001
   - From load balancer or internet (if public)

4. **Test locally:**
   ```bash
   curl http://localhost:3001/health
   ```

#### Cannot Connect to RDS

**Check:**

1. **Security group:**
   - RDS security group allows EC2 security group
   - Port 5432 open

2. **Network ACLs:**
   - Subnet ACLs allow traffic

3. **DNS resolution:**

   ```bash
   nslookup rds-endpoint
   ```

4. **Test connection:**
   ```bash
   psql postgresql://user:password@rds-endpoint:5432/oppskills
   ```

### Recovery Procedures

#### Rollback Backend Deployment

**Method 1: Redeploy previous image**

```bash
# SSH to EC2
ssh ec2-user@<ec2-host>

# Find previous image tag
docker images | grep oppskills-core

# Pull specific version
docker pull 443512646680.dkr.ecr.us-east-1.amazonaws.com/oppskills-core:<previous-sha>

# Stop current container
docker stop oppskills-backend
docker rm oppskills-backend

# Start with previous image
docker run -d --restart unless-stopped \
  --name oppskills-backend \
  -p 3001:3001 \
  -e NODE_ENV=production \
  -e PORT=3001 \
  -e AWS_REGION=us-east-1 \
  -e AWS_SECRETS_ID=oppskills-env \
  -e RUN_SECRETS_LOADER=true \
  -e RUN_MIGRATIONS=false \
  443512646680.dkr.ecr.us-east-1.amazonaws.com/oppskills-core:<previous-sha>
```

**Method 2: Trigger workflow with specific tag**

1. Go to GitHub Actions
2. Select "Deploy backend to EC2"
3. Run workflow with previous Git SHA

#### Rollback Database Migration

**WARNING:** Be extremely careful with migration rollbacks in production.

**Safe approach:**

1. Write a new migration that reverts changes
2. Test thoroughly in staging
3. Apply new migration

**Emergency rollback:**
If you must rollback:

1. Restore RDS snapshot from before migration
2. Update application code to match database schema
3. Redeploy backend

#### Restore from RDS Snapshot

1. AWS Console → RDS → Snapshots
2. Select snapshot before incident
3. Click "Restore snapshot"
4. Create new instance or overwrite existing
5. Update DATABASE_URL in secrets
6. Restart backend container

## Additional Resources

### Documentation Files

- Architecture: `/Users/harshit/Documents/freelance/oppskills-core/docs/architecture.md`
- Backend: `/Users/harshit/Documents/freelance/oppskills-core/docs/backend.md`
- Frontend: `/Users/harshit/Documents/freelance/oppskills-core/docs/frontend.md`
- Database: `/Users/harshit/Documents/freelance/oppskills-core/docs/database.md`
- Development: `/Users/harshit/Documents/freelance/oppskills-core/docs/development.md`
- API: `/Users/harshit/Documents/freelance/oppskills-core/docs/api.md`

### Deployment Guides

- Backend EC2: `/Users/harshit/Documents/freelance/oppskills-core/deploy/backend-ec2.md`
- S3 + CloudFront: `/Users/harshit/Documents/freelance/oppskills-core/deploy/aws-media-s3-cloudfront.md`

### Project Configuration

- Project instructions: `/Users/harshit/Documents/freelance/oppskills-core/CLAUDE.md`
- Turborepo config: `/Users/harshit/Documents/freelance/oppskills-core/turbo.json`
- Prisma schema: `/Users/harshit/Documents/freelance/oppskills-core/packages/database/prisma/schema.prisma`

### External Documentation

- [Prisma Migrations](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [NestJS Deployment](https://docs.nestjs.com/faq/deployment)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Vercel Documentation](https://vercel.com/docs)
- [AWS EC2 Documentation](https://docs.aws.amazon.com/ec2/)
- [AWS ECR Documentation](https://docs.aws.amazon.com/ecr/)
- [AWS Secrets Manager](https://docs.aws.amazon.com/secretsmanager/)

## Deployment Checklist

### Pre-Deployment

- [ ] All tests passing locally
- [ ] Database migrations tested in development
- [ ] Environment variables updated in AWS Secrets Manager
- [ ] Verify GitHub secrets are current
- [ ] Review recent changes and potential breaking changes
- [ ] Notify team of upcoming deployment

### Backend Deployment

- [ ] Merge PR to main branch
- [ ] Monitor GitHub Actions workflow
- [ ] Verify ECR image pushed successfully
- [ ] Verify container started on EC2
- [ ] Check container logs for errors
- [ ] Test API health endpoints
- [ ] Verify database connectivity
- [ ] Verify Redis connectivity
- [ ] Test critical API endpoints

### Frontend Deployment

- [ ] Verify Vercel build started
- [ ] Monitor Vercel build logs
- [ ] Check deployment preview
- [ ] Verify environment variables
- [ ] Test production deployment
- [ ] Verify API calls working
- [ ] Test authentication flows
- [ ] Check for console errors

### Database Migrations

- [ ] Backup database before migration
- [ ] Run migration via dedicated workflow
- [ ] Verify migration completed successfully
- [ ] Test affected features
- [ ] Monitor for database errors
- [ ] Check application logs

### Post-Deployment

- [ ] Smoke test critical user flows
- [ ] Monitor error rates and logs
- [ ] Check performance metrics
- [ ] Verify no unexpected issues
- [ ] Document any issues found
- [ ] Notify team of successful deployment
- [ ] Update deployment log

### Rollback Plan

- [ ] Know how to rollback backend (previous image tag)
- [ ] Know how to rollback frontend (Vercel dashboard)
- [ ] Know how to rollback migrations (if needed)
- [ ] Have RDS snapshot backup available
- [ ] Team members available for emergency response

---

**Last Updated:** 2025-12-20

**Maintained By:** OppSkills Development Team
