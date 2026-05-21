# Google Sheets Integration Test Guide

## Current Status

✅ **Service Configuration**: Google Sheets service is ready and properly configured
✅ **Event Service Integration**: `logToGoogleSheets()` is called automatically when users register
✅ **Credentials**: Service account credentials are correctly set up

## Final Setup Step

**IMPORTANT**: Share your spreadsheet with the service account:

1. Open: https://docs.google.com/spreadsheets/d/1qV7JzLYbrI6KsGN_EqM1s8g6MP40uwayvd2GIwa7SYo/edit
2. Click **Share** button
3. Add: `oppskills-sheets-service@oppskills.iam.gserviceaccount.com`
4. Give **Editor** permissions
5. Uncheck "Notify people"
6. Click **Share**

## How It Works

When a user registers for an event on `/events/:slug`, the following happens automatically:

1. **Frontend**: User fills out registration form on event detail page
2. **API Call**: Frontend calls `POST /event/:id/register` with registration answers
3. **Database**: Registration is saved to the database
4. **Google Sheets**: `logToGoogleSheets()` is called asynchronously (event.service.ts:1110)
5. **Sheet Update**: A new row is added to the 'Registrations' tab

## What Gets Logged

### Fixed Columns (always present):

- `timestamp` - Registration timestamp (ISO format)
- `eventId` - Event ID
- `eventName` - Event name
- `userId` - User ID
- `fullName` - User's full name
- `email` - User's email
- `submissionId` - Submission ID

### Question Columns (dynamic):

- One column per registration form field
- Format: `<Field Label> (<fieldId>)`
- Examples:
  - "Name (default-name)"
  - "Email (default-email)"
  - "Phone No. (default-phone)"
  - "Gender (default-gender)"
  - "How did you hear about us? (custom-field-id)"

## Testing the Integration

### Test 1: Direct API Test (Standalone)

Test the Google Sheets service directly:

```bash
curl -X POST http://localhost:3001/google-sheets/test/registration \
  -H "Content-Type: application/json" \
  -d '{
    "tabName": "Registrations",
    "fixedColumns": {
      "timestamp": "2025-12-23T15:30:00Z",
      "eventId": "test-event-id",
      "eventName": "Test Event",
      "userId": "test-user-id",
      "fullName": "John Doe",
      "email": "john@example.com",
      "submissionId": "test-submission-id"
    },
    "questionColumns": {
      "Name (default-name)": "John Doe",
      "Email (default-email)": "john@example.com",
      "Phone No. (default-phone)": "+1234567890",
      "Gender (default-gender)": "MALE"
    }
  }'
```

**Expected Result**: A new row should appear in the 'Registrations' tab of your spreadsheet.

### Test 2: End-to-End Test (Real Event Registration)

1. **Create a test event** (or use an existing published event)
2. **Navigate to the event page** in your browser: `http://localhost:3000/events/:slug`
3. **Register for the event** using the registration form
4. **Check the Google Sheet** - a new row should appear in the 'Registrations' tab

### Test 3: Verify Backend Logs

After registering, check your backend console for:

```
✅ Success log: "Successfully appended registration row to Registrations"
❌ Error log: "Failed to log to Google Sheets: <error>"
```

## Spreadsheet Structure

The 'Registrations' tab will be automatically created with headers like:

| timestamp | eventId | eventName  | userId  | fullName | email    | submissionId | Name (id) | Email (id) | ... |
| --------- | ------- | ---------- | ------- | -------- | -------- | ------------ | --------- | ---------- | --- |
| 2025-...  | evt-123 | Test Event | usr-456 | John Doe | john@... | sub-789      | John Doe  | john@...   | ... |

### Dynamic Header Management

The service automatically:

- **Creates the tab** if it doesn't exist
- **Adds new headers** when new registration fields are added
- **Maintains fixed column order** (timestamp, eventId, etc. always come first)
- **Preserves existing headers** (never removes columns)

## Troubleshooting

### Issue: "Failed to log to Google Sheets: The caller does not have permission"

**Solution**: Make sure you shared the spreadsheet with `oppskills-sheets-service@oppskills.iam.gserviceaccount.com`

### Issue: "Failed to log to Google Sheets: Unable to parse range"

**Solution**: Check that the spreadsheet ID is correct in your .env.local

### Issue: No logs appearing

**Solution**:

1. Check backend console for errors
2. Verify event registration succeeded (check database)
3. Run diagnostics: `curl http://localhost:3001/google-sheets/diagnostics`

### Issue: Headers not aligned properly

**Solution**:

- The service automatically manages headers
- If headers are misaligned, you can manually delete the 'Registrations' tab and it will be recreated
- Fixed columns (timestamp, eventId, etc.) are always normalized to the beginning

## Code Reference

**Event Registration Flow**:

- File: `apps/backend/src/event/event.service.ts`
- Method: `joinEvent()` (line 744)
- Google Sheets call: Line 1110

**Google Sheets Logging**:

- File: `apps/backend/src/event/event.service.ts`
- Method: `logToGoogleSheets()` (lines 1122-1204)

**Google Sheets Service**:

- File: `apps/backend/src/google-sheets/google-sheets.service.ts`
- Method: `appendRegistrationRow()` (lines 183-289)

## What's Already Working

✅ Google Sheets service is initialized and ready
✅ Service account credentials are configured
✅ Event service automatically calls Google Sheets logging
✅ Dynamic headers are managed automatically
✅ Fixed columns are always first
✅ Errors are caught and logged (doesn't break registration)

## Next Steps

1. ✅ Share the spreadsheet with the service account (see "Final Setup Step" above)
2. ✅ Test with a real event registration
3. ✅ Verify data appears in Google Sheets
4. ✅ Celebrate! 🎉
