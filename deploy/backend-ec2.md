# Backend CI/CD (Docker → ECR → EC2)

This repo ships the backend (`apps/backend`) as a Docker image to Amazon ECR, then deploys it on an EC2 instance via SSH.

## GitHub Actions workflow

Workflow file: `.github/workflows/deploy-backend-ec2.yml`

### What it does

- Builds the backend Docker image using `apps/backend/Dockerfile.prod`
- Pushes to ECR:
  - `443512646680.dkr.ecr.us-east-1.amazonaws.com/oppskills-core:<git-sha>`
  - `443512646680.dkr.ecr.us-east-1.amazonaws.com/oppskills-core:latest`
- Deploys on EC2 using SSH:
  - Pulls the new image
  - Replaces the running container (`oppskills-backend`)
  - Runs Prisma migrations on boot (configurable)
  - Starts NestJS on port `3001`

## Required GitHub secrets

Add these to your GitHub repo **Settings → Secrets and variables → Actions**:

- **`AWS_ACCESS_KEY_ID`**: IAM user access key id (GitHub Actions)
- **`AWS_SECRET_ACCESS_KEY`**: IAM user secret access key (GitHub Actions)
- **`EC2_HOST`**: EC2 public host/IP (example: `ec2-1-2-3-4.compute-1.amazonaws.com`)
- **`EC2_USER`**: SSH user (example: `ec2-user` or `ubuntu`)
- **`EC2_SSH_PRIVATE_KEY`**: SSH private key (PEM contents)
- **`EC2_SSH_PORT`**: optional, defaults to `22`

## One-time EC2 setup

The SSH deploy step assumes the EC2 instance has:

- **Instance IAM role** that allows:
  - `ecr:GetAuthorizationToken`
  - `ecr:BatchCheckLayerAvailability`
  - `ecr:GetDownloadUrlForLayer`
  - `ecr:BatchGetImage`
  - `secretsmanager:GetSecretValue` (for `oppskills-env`, or your chosen secret)
- **Docker installed** and the instance user allowed to run it
- **AWS CLI installed** (used for `aws ecr get-login-password`)

## Runtime configuration

### Secrets

At container boot we load env vars from AWS Secrets Manager:

- Region: `AWS_REGION` (defaults to `us-east-1`)
- Secret id: `AWS_SECRETS_ID` (defaults to `oppskills-env`)

The loader writes:

- `/app/.env` (Nest runtime)
- `/app/packages/database/.env` (`DATABASE_URL` for Prisma)

Loader file: `scripts/load-secrets.mjs`

### Migrations

By default the deploy workflow starts the container with:

- `RUN_MIGRATIONS=true`

If you don’t want migrations on every deploy, set `RUN_MIGRATIONS=false` in the workflow.

## Local build

From repo root:

```bash
docker build -f apps/backend/Dockerfile.prod -t oppskills-backend:local .
docker run --rm -p 3001:3001 oppskills-backend:local
```


