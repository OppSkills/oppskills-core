# Deployment Strategy — OppSkills Core Monorepo

> **Status:** Implemented in repo (Mar 2026)  
> **Goal:** Deploy only what changed + optional Google Chat “Bob the Builder” workflow triggers (minimal cost, no extra Vercel users).

## Table of contents
- [Repo layout (current)](#repo-layout-current)
- [Part A — Selective deployments](#part-a--selective-deployments)
- [Part B — Backend deploy (EC2)](#part-b--backend-deploy-ec2)
- [Part C — Google Chat “Bob the Builder” (Apps Script)](#part-c--google-chat-bob-the-builder-apps-script)
- [Part D — Google Chat notifications from workflows](#part-d--google-chat-notifications-from-workflows)
- [Test plan](#test-plan)

## Repo layout (current)

```
oppskills-core/
├── apps/
│   ├── admin/        → Vercel project (admin)
│   ├── ui-webapp/    → Vercel project (webapp)
│   └── backend/      → EC2 via ECR + Docker
├── packages/         → shared workspace packages
└── .github/workflows/
    ├── deploy-admin-vercel.yml
    ├── deploy-webapp-vercel.yml
        ├── deploy-backend-ec2.yml
    ├── run-migrations-ec2.yml
    ├── deploy-backend.yml        (legacy ECS, manual-only)
    └── deploy-vercel.yml         (deprecated, manual-only)
```

## Part A — Selective deployments

### Why you were seeing “everything redeploys”
The old approach relied on a workflow that committed a `.verceldeployments` file to the repo to “poke” Vercel’s Git Integration. That has two issues:
- It **cannot target** a specific Vercel project in a monorepo (admin vs webapp).
- It triggers on “almost any push”, so you get **unnecessary redeploys**.

### What we use now (recommended)
We deploy each Vercel project using **Vercel CLI** inside GitHub Actions, with `paths:` filters:
- `.github/workflows/deploy-admin-vercel.yml`
- `.github/workflows/deploy-webapp-vercel.yml`

This gives you deterministic control: **only admin deploys when admin changes**, and **only webapp deploys when webapp changes**.

### Required GitHub secrets (Vercel)
Repo → Settings → Secrets and variables → Actions:
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID_ADMIN`
- `VERCEL_PROJECT_ID_WEBAPP`

This works fine with **Vercel Pro (1 user)** because the deploy token is tied to your one user.

### Vercel project settings (one-time)
To avoid double deployments (Vercel auto-deploy + GitHub Actions deploy), **disconnect Git Integration** for both Vercel projects:
- Vercel Project → **Settings → Git → Disconnect**

### Path filter behavior (important)
Both Vercel workflows watch `packages/**` by default:
- If you change `packages/**`, both apps may deploy. This is the safe default in a shared monorepo.
- If you want fewer deploys, you can later refine this to “only deploy dependents of changed packages”, but that’s extra logic.

## Part B — Backend deploy (EC2)

### Canonical workflow
- `.github/workflows/deploy-backend-ec2.yml` is the canonical backend deploy pipeline.
- It triggers only on:
  - `apps/backend/**`
  - `packages/**`
  - root dependency/build files (`pnpm-lock.yaml`, etc.)

### Avoiding double backend deploys
This repo also contains a legacy ECS workflow:
- `.github/workflows/deploy-backend.yml`

It is now **manual-only** (`workflow_dispatch`) so it won’t run on every push and fight the EC2 deploy.

## Part C — Google Chat “Bob the Builder” (Apps Script)

### Overview
Bob is a Google Chat app that listens for messages like:
- `@Bob deploy webapp`
- `@Bob deploy backend migrations=true`

…and triggers the corresponding GitHub workflow via `workflow_dispatch`.

### Command → workflow mapping
| Command in Chat | Triggers workflow | Inputs |
|---|---|---|
| `@Bob deploy admin` | `deploy-admin-vercel.yml` | `reason` |
| `@Bob deploy webapp` | `deploy-webapp-vercel.yml` | `reason` |
| `@Bob deploy backend` | `deploy-backend-ec2.yml` | `run_migrations=false`, `reason` |
| `@Bob deploy backend migrations=true` | `deploy-backend-ec2.yml` | `run_migrations=true`, `reason` |
| `@Bob run migrations` | `run-migrations-ec2.yml` | (optional) `image_tag` |
| `@Bob help` | (reply) | — |

### Step-by-step setup (minimal cost)

#### Step 1 — Create a Google Chat space
1. Google Chat → **New space**
2. Name: `OppSkills Deployments` (suggested)
3. Add only authorized people.

#### Step 2 — Create a fine-grained GitHub PAT for Bob
1. GitHub → Settings → Developer settings → **Fine-grained tokens**
2. Create token:
   - Repository access: **Only select repositories** → `oppskills-core`
   - Permissions:
     - **Actions**: Read and write
3. Save token value (you will paste into Apps Script Properties).

#### Step 3 — Create Apps Script project
1. Go to `https://script.google.com` → **New project**
2. Create `Code.gs` with a `doPost(e)` that:
   - Parses the incoming Google Chat event JSON
   - Checks `event.message.sender.email` against an allowlist
   - Extracts the command from `event.message.argumentText`
   - Calls GitHub API:
     - `POST https://api.github.com/repos/{owner}/{repo}/actions/workflows/{workflow_file}/dispatches`
     - JSON body:
       - `ref`: `"main"`
       - `inputs`: map (strings only)

Recommended Script Properties:
- `GITHUB_OWNER` (e.g. `OppSkills`)
- `GITHUB_REPO` (e.g. `oppskills-core`)
- `GITHUB_TOKEN` (fine-grained PAT)
- `ALLOWED_EMAILS` (comma-separated)

#### Step 4 — Deploy Apps Script as a Web App
1. Apps Script → **Deploy** → **New deployment**
2. Type: **Web app**
3. Execute as: **Me**
4. Who has access: **Anyone** (required so Chat can reach it)
5. Copy the Web App URL.

#### Step 5 — Register in Google Chat API
1. Google Cloud console → create/select a project
2. Enable **Google Chat API**
3. Configure Chat app:
   - Connection settings: **App URL** = Apps Script Web App URL
   - Enable: join spaces + receive messages
4. Add the app to your deployment space.

#### Step 6 — Test
In the space:
- `@Bob help`
- `@Bob deploy webapp`
Then confirm a run appears in GitHub Actions.

## Part D — Google Chat notifications from workflows

If you want workflows to post start/success/failure messages into the same Chat space:
1. In the Google Chat space → **Manage webhooks** → create one
2. Add repo secret: `GCHAT_WEBHOOK_URL`

Workflows already have conditional notify steps that only run when this secret is set:
- `deploy-admin-vercel.yml`
- `deploy-webapp-vercel.yml`
- `deploy-backend-ec2.yml`
- `run-migrations-ec2.yml`

## Test plan
1. Change only `apps/ui-webapp/**`, push to `main` → only **Deploy Webapp to Vercel** should run.
2. Change only `apps/admin/**` → only **Deploy Admin to Vercel** should run.
3. Change only `apps/backend/**` → only **Deploy backend to EC2 (ECR)** should run.
4. Change `packages/**` → admin + webapp + backend workflows may run (expected).

