import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleSheetsService } from './google-sheets.service';

@Controller('google-sheets')
export class GoogleSheetsController {
  constructor(
    private readonly googleSheetsService: GoogleSheetsService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Check if Google Sheets service is ready
   */
  @Get('status')
  @HttpCode(HttpStatus.OK)
  getStatus() {
    const isReady = this.googleSheetsService.isReady();
    return {
      ready: isReady,
      message: isReady
        ? 'Google Sheets service is ready'
        : 'Google Sheets service is not configured',
    };
  }

  /**
   * Detailed configuration diagnostic
   */
  @Get('diagnostics')
  @HttpCode(HttpStatus.OK)
  getDiagnostics() {
    const clientEmail = this.configService.get<string>(
      'GOOGLE_SHEETS_CLIENT_EMAIL',
    );
    const privateKey = this.configService.get<string>(
      'GOOGLE_SHEETS_PRIVATE_KEY',
    );
    const spreadsheetId = this.configService.get<string>(
      'GOOGLE_SHEETS_SPREADSHEET_ID',
    );

    const diagnostics = {
      isReady: this.googleSheetsService.isReady(),
      config: {
        clientEmail: {
          configured: !!clientEmail,
          value: clientEmail ? `${clientEmail.substring(0, 20)}...` : null,
          isServiceAccount: clientEmail?.includes('.iam.gserviceaccount.com'),
          isOAuthClientId: clientEmail?.includes('.apps.googleusercontent.com'),
        },
        privateKey: {
          configured: !!privateKey,
          length: privateKey?.length || 0,
          startsWithBeginKey: privateKey?.includes('BEGIN PRIVATE KEY'),
          isOAuthSecret: privateKey?.startsWith('GOCSPX-'),
        },
        spreadsheetId: {
          configured: !!spreadsheetId,
          value: spreadsheetId || null,
        },
      },
      issues: [] as string[],
      suggestions: [] as string[],
    };

    // Analyze issues
    if (!clientEmail) {
      diagnostics.issues.push('GOOGLE_SHEETS_CLIENT_EMAIL is not set');
      diagnostics.suggestions.push(
        'Set GOOGLE_SHEETS_CLIENT_EMAIL in your .env.local file',
      );
    } else if (diagnostics.config.clientEmail.isOAuthClientId) {
      diagnostics.issues.push(
        'GOOGLE_SHEETS_CLIENT_EMAIL is an OAuth client ID, not a service account email',
      );
      diagnostics.suggestions.push(
        'Create a service account and use an email ending with .iam.gserviceaccount.com',
      );
    }

    if (!privateKey) {
      diagnostics.issues.push('GOOGLE_SHEETS_PRIVATE_KEY is not set');
      diagnostics.suggestions.push(
        'Set GOOGLE_SHEETS_PRIVATE_KEY in your .env.local file',
      );
    } else if (diagnostics.config.privateKey.isOAuthSecret) {
      diagnostics.issues.push(
        'GOOGLE_SHEETS_PRIVATE_KEY is an OAuth client secret, not a service account private key',
      );
      diagnostics.suggestions.push(
        'Use the private_key field from your service account JSON file',
      );
    } else if (!diagnostics.config.privateKey.startsWithBeginKey) {
      diagnostics.issues.push('GOOGLE_SHEETS_PRIVATE_KEY has invalid format');
      diagnostics.suggestions.push(
        'Private key should start with -----BEGIN PRIVATE KEY-----',
      );
    }

    if (!spreadsheetId) {
      diagnostics.issues.push('GOOGLE_SHEETS_SPREADSHEET_ID is not set');
      diagnostics.suggestions.push(
        'Set GOOGLE_SHEETS_SPREADSHEET_ID in your .env.local file',
      );
    }

    if (diagnostics.issues.length === 0 && !diagnostics.isReady) {
      diagnostics.issues.push('Service initialized but not ready');
      diagnostics.suggestions.push('Check backend logs for initialization errors');
    }

    if (diagnostics.issues.length === 0 && diagnostics.isReady) {
      diagnostics.suggestions.push(
        `Make sure to share spreadsheet ${spreadsheetId} with ${clientEmail}`,
      );
    }

    return diagnostics;
  }

  /**
   * Test appending a simple row to a sheet
   * Example body:
   * {
   *   "range": "Sheet1!A1",
   *   "values": ["Name", "Email", "Phone"]
   * }
   */
  @Post('test/append-row')
  @HttpCode(HttpStatus.OK)
  async testAppendRow(
    @Body() body: { range: string; values: (string | number | null)[] },
  ) {
    await this.googleSheetsService.appendRow(body.range, body.values);
    return {
      success: true,
      message: 'Row appended successfully',
      data: body,
    };
  }

  /**
   * Get headers from a specific sheet tab
   */
  @Get('test/headers/:tabName')
  @HttpCode(HttpStatus.OK)
  async testGetHeaders(@Param('tabName') tabName: string) {
    const headers = await this.googleSheetsService.getHeaders(tabName);
    return {
      success: true,
      tabName,
      headers,
    };
  }

  /**
   * Update headers for a specific sheet tab
   * Example body:
   * {
   *   "headers": ["Name", "Email", "Phone", "City"]
   * }
   */
  @Post('test/headers/:tabName')
  @HttpCode(HttpStatus.OK)
  async testUpdateHeaders(
    @Param('tabName') tabName: string,
    @Body() body: { headers: string[] },
  ) {
    await this.googleSheetsService.updateHeaders(tabName, body.headers);
    return {
      success: true,
      message: 'Headers updated successfully',
      tabName,
      headers: body.headers,
    };
  }

  /**
   * Ensure a tab exists (creates if missing)
   */
  @Post('test/ensure-tab/:tabName')
  @HttpCode(HttpStatus.OK)
  async testEnsureTab(@Param('tabName') tabName: string) {
    const success = await this.googleSheetsService.ensureTabExists(tabName);
    return {
      success,
      message: success
        ? `Tab '${tabName}' exists or was created`
        : `Failed to ensure tab '${tabName}'`,
      tabName,
    };
  }

  /**
   * Test the full registration flow
   * Example body:
   * {
   *   "tabName": "EventRegistrations",
   *   "fixedColumns": {
   *     "Timestamp": "2025-12-23 10:30:00",
   *     "Name": "John Doe",
   *     "Email": "john@example.com",
   *     "Event": "Tech Meetup 2025"
   *   },
   *   "questionColumns": {
   *     "How did you hear about us?": "Social Media",
   *     "Dietary Restrictions": "Vegetarian",
   *     "T-Shirt Size": "L"
   *   }
   * }
   */
  @Post('test/registration')
  @HttpCode(HttpStatus.OK)
  async testAppendRegistration(
    @Body()
    body: {
      tabName: string;
      fixedColumns: Record<string, string | number | null>;
      questionColumns: Record<string, string | number | null>;
    },
  ) {
    await this.googleSheetsService.appendRegistrationRow(
      body.tabName,
      body.fixedColumns,
      body.questionColumns,
    );
    return {
      success: true,
      message: 'Registration row appended successfully',
      data: body,
    };
  }
}
