### Goal

Deploy the OppSkills backend to **Ubuntu EC2**, behind **Nginx**, with **GitHub Actions → ECR → EC2**.

Key points in this repo:
- **Image**: built from `apps/backend/Dockerfile.prod`
- **Secrets**: loaded at container start via `load-secrets.mts` into **`/app/.env`** (and Prisma env into `packages/database/.env`)
- **Backend port**: container listens on **3001**, bound to **127.0.0.1** on the host

---

### 1) AWS prerequisites

- **Region**: `us-east-1` (matches workflow default)
- **Secrets Manager**:
  - Create a secret named **`oppskills-env`** (type: Other type of secret, JSON)
  - Must include at least:
    - `DATABASE_URL` (Neon Postgres URL, typically includes `sslmode=require`)
  - Add any other runtime env vars you need (Clerk keys, NewRelic, etc.)

- **ECR**:
  - Create an ECR repository (example name: `oppskills-backend`)
  - Save the repo name into GitHub secret: `ECR_REPOSITORY`

---

### 2) EC2 instance (Ubuntu) + security group

- **AMI**: Ubuntu (AWS default)
- **Instance type**: start with `t3.small` or above for Node build/memory comfort
- **Security Group inbound**:
  - **22 (SSH)**: restrict to your IP
  - **80 (HTTP)**: `0.0.0.0/0`
  - **443 (HTTPS)**: `0.0.0.0/0`
  - Do **NOT** open 3001 publicly (Nginx proxies to localhost)

---

### 3) IAM: instance role (recommended)

Attach an instance profile role to EC2 with:

- **SecretsManager** read:
  - `secretsmanager:GetSecretValue` for secret ARN `oppskills-env`
  - `kms:Decrypt` if the secret uses a customer-managed KMS key

- **ECR pull**:
  - `ecr:GetAuthorizationToken`
  - `ecr:BatchCheckLayerAvailability`
  - `ecr:GetDownloadUrlForLayer`
  - `ecr:BatchGetImage`

This is needed because:
- The EC2 host uses AWS CLI to login/pull from ECR.
- The container uses AWS SDK to fetch secrets (via IMDS/instance role).

---

### 4) Bootstrap the EC2 machine

SSH into the instance and run:

```bash
sudo apt-get update -y
```

Then run the bootstrap script from this repo (copy it onto the instance or paste its content):

```bash
sudo bash infra/scripts/ubuntu-ec2-bootstrap.sh
```

Verify:

```bash
docker --version
aws --version
nginx -v
```

---

### 5) Configure Nginx reverse proxy

Copy `infra/nginx/oppskills-backend.conf` to:
- `/etc/nginx/sites-available/oppskills-backend.conf`

Edit `server_name` to your domain (example: `api.yourdomain.com`).

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/oppskills-backend.conf /etc/nginx/sites-enabled/oppskills-backend.conf
sudo nginx -t
sudo systemctl reload nginx
```

---

### 6) HTTPS (Let’s Encrypt)

If you have a real domain pointing to this EC2 instance:

```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d api.yourdomain.com
```

---

### 7) GitHub Actions secrets (repo settings → secrets)

Required (current workflow uses access keys for pushing to ECR):

- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `ECR_REPOSITORY`
- `EC2_HOST`
- `EC2_USER`
- `EC2_PORT` (usually `22`)
- `EC2_SSH_KEY` (private key content)

---

### 8) How deployment works

On every push to `main` (when backend/packages change), GitHub Actions:
- Builds & pushes an image to ECR
- SSHes to EC2, pulls image, runs container:
  - binds to `127.0.0.1:3001`
  - runs `pnpm load-secrets` (creates `/app/.env`)
  - runs migrations unless `skip_migrations=true`
  - starts `node apps/backend/dist/main.js`

---

### 9) Quick smoke checks on EC2

- Nginx is serving:

```bash
curl -i http://localhost
```

- Backend container is healthy:

```bash
curl -i http://127.0.0.1:3001/health
```

- Nginx → backend proxy works (once `server_name` is set and DNS points):

```bash
curl -i http://api.yourdomain.com/health
```


