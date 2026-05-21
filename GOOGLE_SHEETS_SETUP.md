# Google Sheets Integration Setup

## Quick Start Guide

### 1. Create a Google Cloud Service Account

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project or create a new one
3. Navigate to **IAM & Admin** > **Service Accounts**
4. Click **+ CREATE SERVICE ACCOUNT**
5. Name: `oppskills-sheets-service`
6. Click **Create and Continue** > **Continue** > **Done**

### 2. Generate Service Account Key

1. Click on the service account you just created
2. Go to **Keys** tab
3. Click **Add Key** > **Create New Key**
4. Select **JSON** format
5. Click **Create**
6. Save the downloaded JSON file securely

### 3. Enable Google Sheets API

1. In Google Cloud Console, go to **APIs & Services** > **Library**
2. Search for "Google Sheets API"
3. Click on it and click **Enable**

### 4. Share Your Spreadsheet with the Service Account

**IMPORTANT:** You must share your Google Sheet with the service account email!

1. Open your Google Sheet: https://docs.google.com/spreadsheets/d/1qV7JzLYbrI6KsGN_EqM1s8g6MP40uwayvd2GIwa7SYo/edit
2. Click **Share** button (top right)
3. Add the service account email (from the JSON file's `client_email` field)
   - It will look like: `oppskills-sheets-service@your-project.iam.gserviceaccount.com`
4. Give it **Editor** permissions
5. Uncheck "Notify people"
6. Click **Share**

### 5. Update Environment Variables

Open `apps/backend/.env.local` and update with values from your downloaded JSON file:

```bash
# From the JSON file:
# "client_email": "your-service-account@your-project.iam.gserviceaccount.com"
GOOGLE_SHEETS_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com

# From the JSON file:
# "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
# Copy the ENTIRE private key including the BEGIN and END lines
GOOGLE_SHEETS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBg...(your key here)...==\n-----END PRIVATE KEY-----\n"

# Your spreadsheet ID (already correct)
GOOGLE_SHEETS_SPREADSHEET_ID=1qV7JzLYbrI6KsGN_EqM1s8g6MP40uwayvd2GIwa7SYo
```

### 6. Restart Your Backend

```bash
# Stop your backend (Ctrl+C)
# Then restart
pnpm dev:backend
```

### 7. Test the Integration

```bash
# Check status
curl http://localhost:3001/google-sheets/status

# Should return: {"ready":true,"message":"Google Sheets service is ready"}

# Test a simple registration
curl -X POST http://localhost:3001/google-sheets/test/registration \
  -H "Content-Type: application/json" \
  -d '{
    "tabName": "TestRegistrations",
    "fixedColumns": {
      "Timestamp": "2025-12-23 10:30:00",
      "Name": "Test User",
      "Email": "test@example.com"
    },
    "questionColumns": {
      "Question 1": "Answer 1"
    }
  }'
```

## Troubleshooting

### Error: "Service not initialized"

- Check that all three env variables are set
- Restart the backend after changing .env.local

### Error: "The caller does not have permission"

- Make sure you shared the spreadsheet with the service account email
- The service account email must have Editor access

### Error: "Unable to parse range"

- Check that the spreadsheet ID is correct
- Make sure the tab name exists in your spreadsheet

### Private Key Format Issues

If you get authentication errors, ensure your private key:

- Starts with `-----BEGIN PRIVATE KEY-----`
- Ends with `-----END PRIVATE KEY-----`
- Has `\n` for newlines (the service automatically converts these)
- Is wrapped in double quotes in the .env file

Example from JSON:

```json
{
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQE...\n-----END PRIVATE KEY-----\n"
}
```

Copy this EXACT value (including the `\n` characters) into your .env.local file.

## Current Configuration

Your spreadsheet: https://docs.google.com/spreadsheets/d/1qV7JzLYbrI6KsGN_EqM1s8g6MP40uwayvd2GIwa7SYo/edit

You need to:

1. ✅ Spreadsheet ID is already configured
2. ❌ Create a service account and get credentials
3. ❌ Share the spreadsheet with the service account
4. ❌ Update .env.local with the service account credentials
