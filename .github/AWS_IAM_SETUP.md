# AWS IAM Setup for GitHub Actions CI/CD

This guide will help you set up the necessary AWS IAM user and permissions for the GitHub Actions deployment pipeline.

## Overview

The GitHub Actions workflow needs AWS credentials to:

- Push Docker images to Amazon ECR
- Update ECS task definitions
- Deploy to ECS service
- Run database migration tasks
- Access CloudWatch logs

## Option 1: Create IAM User (Recommended for Getting Started)

### Step 1: Create IAM Policy

1. Open the AWS Console and go to **IAM** → **Policies**
2. Click **Create Policy**
3. Switch to the **JSON** tab
4. Paste the following policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "ECRAccess",
      "Effect": "Allow",
      "Action": [
        "ecr:GetAuthorizationToken",
        "ecr:BatchCheckLayerAvailability",
        "ecr:GetDownloadUrlForLayer",
        "ecr:BatchGetImage",
        "ecr:PutImage",
        "ecr:InitiateLayerUpload",
        "ecr:UploadLayerPart",
        "ecr:CompleteLayerUpload",
        "ecr:DescribeRepositories",
        "ecr:ListImages"
      ],
      "Resource": "*"
    },
    {
      "Sid": "ECSAccess",
      "Effect": "Allow",
      "Action": [
        "ecs:DescribeServices",
        "ecs:DescribeTaskDefinition",
        "ecs:DescribeTasks",
        "ecs:ListTasks",
        "ecs:RegisterTaskDefinition",
        "ecs:UpdateService",
        "ecs:RunTask",
        "ecs:StopTask"
      ],
      "Resource": "*"
    },
    {
      "Sid": "PassRoleToECS",
      "Effect": "Allow",
      "Action": ["iam:PassRole"],
      "Resource": [
        "arn:aws:iam::443512646680:role/ecsTaskExecutionRole",
        "arn:aws:iam::443512646680:role/ecsTaskRole"
      ],
      "Condition": {
        "StringEquals": {
          "iam:PassedToService": "ecs-tasks.amazonaws.com"
        }
      }
    },
    {
      "Sid": "CloudWatchLogsAccess",
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents",
        "logs:DescribeLogStreams",
        "logs:GetLogEvents"
      ],
      "Resource": [
        "arn:aws:logs:us-east-1:443512646680:log-group:/ecs/*",
        "arn:aws:logs:us-east-1:443512646680:log-group:/ecs/*:*"
      ]
    }
  ]
}
```

5. Click **Next**
6. Name the policy: `GitHubActions-OppSkills-Deployment`
7. Add description: "Allows GitHub Actions to deploy OppSkills backend to ECS"
8. Click **Create policy**

### Step 2: Create IAM User

1. Go to **IAM** → **Users**
2. Click **Create user**
3. User name: `github-actions-oppskills-deploy`
4. Click **Next**

### Step 3: Attach Policy to User

1. Select **Attach policies directly**
2. Search for `GitHubActions-OppSkills-Deployment`
3. Check the box next to your policy
4. Click **Next**
5. Review and click **Create user**

### Step 4: Create Access Keys

1. Click on the newly created user `github-actions-oppskills-deploy`
2. Go to the **Security credentials** tab
3. Scroll down to **Access keys**
4. Click **Create access key**
5. Select use case: **Application running outside AWS**
6. Click **Next**
7. Add description tag: `GitHub Actions deployment for oppskills-core`
8. Click **Create access key**
9. **IMPORTANT**: Copy both the **Access key ID** and **Secret access key**
   - You won't be able to see the secret key again!
   - Store them securely for the next step

## Option 2: Use OIDC (Recommended for Production)

For production environments, consider using OpenID Connect (OIDC) instead of long-lived access keys. This is more secure but requires additional setup.

[OIDC Setup Guide](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/configuring-openid-connect-in-amazon-web-services)

## Verify ECS Task Roles

Your ECS tasks need proper IAM roles to function correctly.

### Task Execution Role (ecsTaskExecutionRole)

This role is used by ECS to pull images and send logs. Verify it has these permissions:

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
      "Action": ["logs:CreateLogStream", "logs:PutLogEvents"],
      "Resource": "arn:aws:logs:us-east-1:443512646680:log-group:/ecs/*"
    }
  ]
}
```

### Task Role (ecsTaskRole)

This role is used by your application at runtime. It needs access to AWS Secrets Manager:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["secretsmanager:GetSecretValue"],
      "Resource": "arn:aws:secretsmanager:us-east-1:443512646680:secret:oppskills-env-*"
    },
    {
      "Effect": "Allow",
      "Action": ["sts:GetCallerIdentity"],
      "Resource": "*"
    }
  ]
}
```

## Configure GitHub Secrets

Now that you have AWS credentials, add them to GitHub:

### Step 1: Go to GitHub Repository

1. Navigate to your repository: `https://github.com/YOUR_ORG/oppskills-core`
2. Click on **Settings**
3. In the left sidebar, go to **Secrets and variables** → **Actions**

### Step 2: Add Repository Secrets

Click **New repository secret** for each of the following:

#### 1. AWS_ACCESS_KEY_ID

- **Name**: `AWS_ACCESS_KEY_ID`
- **Value**: Paste the Access Key ID from Step 4 above
- Click **Add secret**

#### 2. AWS_SECRET_ACCESS_KEY

- **Name**: `AWS_SECRET_ACCESS_KEY`
- **Value**: Paste the Secret Access Key from Step 4 above
- Click **Add secret**

#### 3. ECR_REPOSITORY

- **Name**: `ECR_REPOSITORY`
- **Value**: Your ECR repository name (e.g., `oppskills-backend`)
  - Just the repository name, not the full URI
  - Example: `oppskills-backend` (NOT `443512646680.dkr.ecr.us-east-1.amazonaws.com/oppskills-backend`)
- Click **Add secret**

### Step 3: Verify Secrets

You should now see three secrets:

- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `ECR_REPOSITORY`

## Find Your ECR Repository Name

If you're unsure of your ECR repository name:

```bash
# List all ECR repositories
aws ecr describe-repositories --region us-east-1

# Or specifically for oppskills
aws ecr describe-repositories \
  --region us-east-1 \
  --query 'repositories[?contains(repositoryName, `oppskills`)].repositoryName' \
  --output table
```

The output will show your repository name. Use just the name part (e.g., `oppskills-backend`).

## Test the Setup

### Option 1: Manual Workflow Run

1. Go to your repository on GitHub
2. Click **Actions** tab
3. Select **Deploy Backend to AWS ECS** workflow
4. Click **Run workflow**
5. Select branch: `main`
6. Click **Run workflow**

This will test the deployment without requiring a code push.

### Option 2: Push a Small Change

Make a small change to trigger the workflow:

```bash
# Add a comment to trigger deployment
echo "# Trigger deployment" >> apps/backend/README.md
git add apps/backend/README.md
git commit -m "Test: Trigger CI/CD deployment"
git push origin main
```

## Troubleshooting

### Error: "User is not authorized to perform: ecr:GetAuthorizationToken"

**Solution**: The IAM user doesn't have ECR permissions. Verify:

1. The policy is attached to the IAM user
2. The policy includes all ECR actions listed above

### Error: "User is not authorized to perform: iam:PassRole"

**Solution**: The IAM user needs PassRole permission. Verify:

1. The PassRole statement in the policy includes your task execution and task role ARNs
2. The ARNs match your actual role ARNs (check in ECS task definition)

### Error: "Unable to describe services"

**Solution**: The IAM user needs ECS permissions:

1. Verify the ECS policy statement is attached
2. Check the cluster and service names match your configuration

### Error: "Access Denied" when running migrations

**Solution**: This is likely an issue with the ECS task role, not the GitHub Actions IAM user:

1. Verify the task role has `secretsmanager:GetSecretValue` permission
2. Verify the secret name is exactly `oppskills-env`
3. Check CloudWatch logs for more details:
   ```bash
   aws logs tail /ecs/oppskills-backend --follow
   ```

### Finding Your Role ARNs

If you need to find your ECS task role ARNs:

```bash
# Get task definition details
aws ecs describe-task-definition \
  --task-definition $(aws ecs describe-services \
    --cluster oppskills-core \
    --services oppskills-api-server-task-service-zql8vo1s \
    --query 'services[0].taskDefinition' \
    --output text) \
  --query 'taskDefinition.{ExecutionRole:executionRoleArn,TaskRole:taskRoleArn}' \
  --output table
```

Update the PassRole statement in your IAM policy with these ARNs.

## Security Best Practices

1. **Rotate Access Keys Regularly**: Set a reminder to rotate keys every 90 days
2. **Use OIDC in Production**: Migrate to OIDC for better security (no long-lived credentials)
3. **Principle of Least Privilege**: Only grant permissions necessary for deployment
4. **Monitor IAM Activity**: Set up CloudTrail to monitor IAM user activity
5. **Enable MFA**: For production, consider requiring MFA for sensitive operations

## Next Steps

After setting up IAM and GitHub Secrets:

1. ✅ Test the deployment with a manual workflow run
2. ✅ Monitor the GitHub Actions logs for any errors
3. ✅ Verify the deployment succeeded in AWS ECS console
4. ✅ Check your backend is responding at the health endpoint
5. ✅ Review CloudWatch logs for any application errors

## Additional Resources

- [AWS IAM Best Practices](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html)
- [GitHub Actions Security](https://docs.github.com/en/actions/security-guides/security-hardening-for-github-actions)
- [ECS Task IAM Roles](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task-iam-roles.html)
