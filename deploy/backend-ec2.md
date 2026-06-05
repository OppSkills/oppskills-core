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

- **Instance IAM role** (`oppskills-ec2-role`) that allows:
  - `ecr:GetAuthorizationToken`
  - `ecr:BatchCheckLayerAvailability`
  - `ecr:GetDownloadUrlForLayer`
  - `ecr:BatchGetImage`
  - `secretsmanager:GetSecretValue` (for `oppskills-env`, or your chosen secret)
  - **S3 on `oppskills-assets`**: `s3:GetObject`, `s3:PutObject`, `s3:DeleteObject` on `arn:aws:s3:::oppskills-assets/*` (required for chat attachment upload **and** download/stream — see `deploy/aws-media-s3-cloudfront.md` §6)
- **Docker installed** and the instance user allowed to run it
- **AWS CLI installed** (used for `aws ecr get-login-password`)

### If deploy fails with: "permission denied while trying to connect to the docker API"

That means your SSH user can’t access Docker’s socket (`/var/run/docker.sock`).

Fix one of these on the EC2 instance:

- **Add the SSH user to the docker group** (then re-login):
  - `sudo usermod -aG docker <your-user>`
- **OR allow non-interactive sudo for docker** (so CI can run `sudo -n docker ...`)
- **OR use a different SSH user** that already has Docker access

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

- `RUN_MIGRATIONS=false`

If you want to run migrations, trigger the deploy workflow manually (`workflow_dispatch`) with:

- `run_migrations=true`

Or use the dedicated manual workflow:

- `.github/workflows/run-migrations-ec2.yml`

### Prisma P3009 (failed migration) runbook

If you see:

- `Error: P3009 migrate found failed migrations in the target database`

it means a previous migration **started and failed** on the database, and Prisma will not apply new migrations until it’s resolved.

**Step 1: stop the container crash loop**

- Ensure deploy is running with `RUN_MIGRATIONS=false` (default now).

**Step 2: find the failing migration and root error**

The failing migration name in your logs is:

- `20251106112805_oppskills`

To see the underlying SQL error, connect to the DB and inspect Prisma’s migrations table:

- Table: `_prisma_migrations`

Look at the row for `migration_name='20251106112805_oppskills'` and check `logs`, `finished_at`, `rolled_back_at`.

**Step 3: resolve the migration**

Use `prisma migrate resolve` depending on what happened:

- If the migration **did not actually apply** (no schema changes): mark it rolled back:
  - `pnpm -C packages/database exec prisma migrate resolve --rolled-back "20251106112805_oppskills" --schema packages/database/prisma`
- If the migration **partially applied**: fix the DB manually (or restore from backup), then mark it applied:
  - `pnpm -C packages/database exec prisma migrate resolve --applied "20251106112805_oppskills" --schema packages/database/prisma`

**Step 4: run migrations**

Run the manual workflow `.github/workflows/run-migrations-ec2.yml` (or deploy with `run_migrations=true`).

## Local build

From repo root:

```bash
docker build -f apps/backend/Dockerfile.prod -t oppskills-backend:local .
docker run --rm -p 3001:3001 oppskills-backend:local
```
