import * as XLSX from "xlsx";

interface ExportToExcelOptions {
  rows: Record<string, string | number | boolean | null | undefined>[];
  fileName: string;
  sheetName: string;
}

/**
 * Converts an array of flat row objects to an .xlsx file and triggers a
 * browser download. Safe to call only on the client side.
 */
export function exportToExcel({
  rows,
  fileName,
  sheetName,
}: ExportToExcelOptions): void {
  if (rows.length === 0) {
    console.warn("[exportToExcel] No rows provided – skipping export.");
    return;
  }

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, fileName);
}
