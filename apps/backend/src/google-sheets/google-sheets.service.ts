import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google, sheets_v4 } from 'googleapis';

@Injectable()
export class GoogleSheetsService {
  private readonly logger = new Logger(GoogleSheetsService.name);
  private sheets: sheets_v4.Sheets | null = null;
  private spreadsheetId: string;

  constructor(private configService: ConfigService) {
    const clientEmail = this.configService.get<string>(
      'GOOGLE_SHEETS_CLIENT_EMAIL',
    );
    const privateKey = this.configService
      .get<string>('GOOGLE_SHEETS_PRIVATE_KEY')
      ?.replace(/\\n/g, '\n');
    this.spreadsheetId =
      this.configService.get<string>('GOOGLE_SHEETS_SPREADSHEET_ID') || '';

    if (clientEmail && privateKey && this.spreadsheetId) {
      try {
        const auth = new google.auth.JWT(clientEmail, undefined, privateKey, [
          'https://www.googleapis.com/auth/spreadsheets',
        ]);
        this.sheets = google.sheets({ version: 'v4', auth });
        this.logger.log('Google Sheets API initialized successfully.');
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : String(error);
        this.logger.error(`Failed to initialize Google Sheets API: ${errMsg}`);
      }
    } else {
      this.logger.warn(
        'Google Sheets configuration is missing (GOOGLE_SHEETS_CLIENT_EMAIL, GOOGLE_SHEETS_PRIVATE_KEY, or GOOGLE_SHEETS_SPREADSHEET_ID). Logging to spreadsheet will be disabled.',
      );
    }
  }

  /**
   * Check if service is initialized and ready.
   */
  isReady(): boolean {
    return this.sheets !== null;
  }

  /**
   * Appends a row to the specified range.
   */
  async appendRow(
    range: string,
    values: (string | number | null | undefined)[],
  ) {
    if (!this.sheets) {
      this.logger.warn(
        'Google Sheets service not initialized. Skipping append.',
      );
      return;
    }

    try {
      await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range,
        valueInputOption: 'RAW',
        requestBody: {
          values: [values.map((v) => v ?? '')],
        },
      });
      this.logger.log(
        `Successfully appended row to Google Sheets at range: ${range}`,
      );
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to append row to Google Sheets: ${errMsg}`);
    }
  }

  /**
   * Reads the header row (row 1) of a sheet tab.
   */
  async getHeaders(tabName: string): Promise<string[]> {
    if (!this.sheets) {
      this.logger.warn('Google Sheets service not initialized.');
      return [];
    }

    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${tabName}!1:1`,
      });

      const row = response.data.values?.[0];
      if (!row) return [];
      return row.map((cell) => String(cell ?? ''));
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      // Sheet might not exist yet
      this.logger.warn(`Failed to get headers from ${tabName}: ${errMsg}`);
      return [];
    }
  }

  /**
   * Updates the header row (row 1) of a sheet tab.
   */
  async updateHeaders(tabName: string, headers: string[]): Promise<void> {
    if (!this.sheets) {
      this.logger.warn('Google Sheets service not initialized.');
      return;
    }

    try {
      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: `${tabName}!1:1`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [headers],
        },
      });
      this.logger.log(`Updated headers in ${tabName}`);
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to update headers in ${tabName}: ${errMsg}`);
    }
  }

  /**
   * Ensures a tab exists in the spreadsheet. Creates it if missing.
   */
  async ensureTabExists(tabName: string): Promise<boolean> {
    if (!this.sheets) {
      return false;
    }

    try {
      // Get spreadsheet metadata to check existing sheets
      const spreadsheet = await this.sheets.spreadsheets.get({
        spreadsheetId: this.spreadsheetId,
      });

      const existingSheets = spreadsheet.data.sheets ?? [];
      const tabExists = existingSheets.some(
        (sheet) => sheet.properties?.title === tabName,
      );

      if (tabExists) {
        return true;
      }

      // Create the tab
      await this.sheets.spreadsheets.batchUpdate({
        spreadsheetId: this.spreadsheetId,
        requestBody: {
          requests: [
            {
              addSheet: {
                properties: {
                  title: tabName,
                },
              },
            },
          ],
        },
      });

      this.logger.log(`Created new tab: ${tabName}`);
      return true;
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to ensure tab exists: ${errMsg}`);
      return false;
    }
  }

  /**
   * Appends a registration row with dynamic columns.
   * - Ensures tab exists
   * - Reads/extends headers as needed
   * - Appends row aligned to header order
   */
  async appendRegistrationRow(
    tabName: string,
    fixedColumns: Record<string, string | number | null>,
    questionColumns: Record<string, string | number | null>,
  ): Promise<void> {
    if (!this.sheets) {
      this.logger.warn(
        'Google Sheets service not initialized. Skipping registration log.',
      );
      return;
    }

    try {
      // Ensure tab exists
      const tabReady = await this.ensureTabExists(tabName);
      if (!tabReady) {
        this.logger.error(
          `Cannot append to ${tabName}: tab could not be created.`,
        );
        return;
      }

      // Read current headers
      const currentHeaders = await this.getHeaders(tabName);

      // Fixed column headers in order
      const fixedKeys = Object.keys(fixedColumns);

      // Build header list: fixed columns first, then question columns
      let headersNeedUpdate = false;
      let finalHeaders: string[] = [...currentHeaders];

      /**
       * Normalize fixed headers to avoid:
       * - Duplicates (fixed key present multiple times)
       * - Wrong fixed-header positions (fixed key present but not at the intended index)
       *
       * Steps:
       * 1) Remove *all* occurrences of each fixed key from the existing headers.
       * 2) Prepend fixed keys in their required order.
       * 3) If the rebuilt header list differs, mark an update and adopt it.
       */
      const fixedKeySet: ReadonlySet<string> = new Set<string>(fixedKeys);
      const remainingHeaders: string[] = finalHeaders.filter(
        (header) => !fixedKeySet.has(header),
      );
      const newHeaders: string[] = [...fixedKeys, ...remainingHeaders];

      // Compare arrays by length and by position (preserves order correctness).
      let fixedHeadersDiffer: boolean =
        newHeaders.length !== finalHeaders.length;
      if (!fixedHeadersDiffer) {
        for (let i = 0; i < newHeaders.length; i++) {
          if (newHeaders[i] !== finalHeaders[i]) {
            fixedHeadersDiffer = true;
            break;
          }
        }
      }

      if (fixedHeadersDiffer) {
        headersNeedUpdate = true;
        finalHeaders = newHeaders;
      }

      // Ensure question columns exist (append new ones, never reorder)
      for (const qHeader of Object.keys(questionColumns)) {
        if (!finalHeaders.includes(qHeader)) {
          finalHeaders.push(qHeader);
          headersNeedUpdate = true;
        }
      }

      // Update headers if changed
      if (headersNeedUpdate || currentHeaders.length === 0) {
        await this.updateHeaders(tabName, finalHeaders);
      }

      // Build row aligned to final headers
      const rowValues: (string | number | null)[] = finalHeaders.map(
        (header) => {
          if (header in fixedColumns) {
            return fixedColumns[header] ?? '';
          }
          if (header in questionColumns) {
            return questionColumns[header] ?? '';
          }
          return '';
        },
      );

      // Append to tab (starting from row 2)
      await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: `${tabName}!A2`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [rowValues.map((v) => v ?? '')],
        },
      });

      this.logger.log(`Successfully appended registration row to ${tabName}`);
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to append registration row: ${errMsg}`);
    }
  }
}
