import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google } from 'googleapis';

@Injectable()
export class GoogleSheetsService {
  private readonly logger = new Logger(GoogleSheetsService.name);
  private sheets: any;
  private spreadsheetId: string;

  constructor(private configService: ConfigService) {
    const clientEmail = this.configService.get<string>('GOOGLE_SHEETS_CLIENT_EMAIL');
    const privateKey = this.configService.get<string>('GOOGLE_SHEETS_PRIVATE_KEY')?.replace(/\\n/g, '\n');
    this.spreadsheetId = this.configService.get<string>('GOOGLE_SHEETS_SPREADSHEET_ID') || '';

    if (clientEmail && privateKey && this.spreadsheetId) {
      try {
        const auth = new google.auth.JWT(
          clientEmail,
          undefined,
          privateKey,
          ['https://www.googleapis.com/auth/spreadsheets'],
        );
        this.sheets = google.sheets({ version: 'v4', auth });
        this.logger.log('Google Sheets API initialized successfully.');
      } catch (error) {
        this.logger.error(`Failed to initialize Google Sheets API: ${error.message}`);
      }
    } else {
      this.logger.warn('Google Sheets configuration is missing (GOOGLE_SHEETS_CLIENT_EMAIL, GOOGLE_SHEETS_PRIVATE_KEY, or GOOGLE_SHEETS_SPREADSHEET_ID). Logging to spreadsheet will be disabled.');
    }
  }

  async appendRow(range: string, values: any[]) {
    if (!this.sheets) {
      this.logger.warn('Google Sheets service not initialized. Skipping append.');
      return;
    }

    try {
      await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range,
        valueInputOption: 'RAW',
        requestBody: {
          values: [values],
        },
      });
      this.logger.log(`Successfully appended row to Google Sheets at range: ${range}`);
    } catch (error) {
      this.logger.error(`Failed to append row to Google Sheets: ${error.message}`);
    }
  }
}
