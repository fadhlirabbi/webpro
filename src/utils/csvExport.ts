import ExcelJS from 'exceljs';

export interface ExportReportOptions {
  reportTitle?: string;
  summaryMetrics?: { label: string; value: string | number }[];
  notes?: string;
  includeMetadataHeader?: boolean;
}

/**
 * Clean & Formatted CSV Export Utility
 * Ensures clean column separation, proper UTF-8 BOM, and no squished column headers.
 */
export function exportToCSV(
  filename: string,
  rows: Record<string, any>[],
  options?: ExportReportOptions
) {
  if (!rows || !rows.length) {
    alert('Tidak ada data untuk diunduh.');
    return;
  }

  const headers = Object.keys(rows[0]);
  const delimiter = ';';
  const totalCols = headers.length;
  const lines: string[] = [];

  // Directive for Microsoft Excel to auto-detect semicolon delimiter
  lines.push(`sep=${delimiter}`);

  // Helper to pad metadata lines so every row has exact same column count
  const padToCols = (text: string) => {
    const cols = [`"${text.replace(/"/g, '""')}"`];
    for (let i = 1; i < totalCols; i++) {
      cols.push('""');
    }
    return cols.join(delimiter);
  };

  // Only show top metadata header in CSV if explicitly requested with includeMetadataHeader: true
  if (options?.includeMetadataHeader === true) {
    const dateStr = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }) + ' WIB';

    const reportTitle = options?.reportTitle || filename.replace(/_/g, ' ');
    lines.push(padToCols('WEBPRO OPERATIONS PLATFORM - LAPORAN RESMI'));
    lines.push(padToCols(`Judul Laporan: ${reportTitle}`));
    lines.push(padToCols(`Tanggal Ekspor: ${dateStr}`));
    lines.push(padToCols(`Total Record: ${rows.length} Item`));

    if (options?.summaryMetrics && options.summaryMetrics.length > 0) {
      options.summaryMetrics.forEach((m) => {
        lines.push(padToCols(`${m.label}: ${m.value}`));
      });
    }

    lines.push(Array(totalCols).fill('""').join(delimiter)); // Empty line separator
  }

  // 1. Table Headers (Row 1 of table data)
  lines.push(headers.map((h) => `"${String(h).replace(/"/g, '""')}"`).join(delimiter));

  // 2. Table Data Rows
  rows.forEach((row) => {
    const formattedRow = headers.map((field) => {
      let val = row[field];
      if (val === null || val === undefined) val = '';
      const valString = String(val).replace(/"/g, '""');
      return `"${valString}"`;
    });
    lines.push(formattedRow.join(delimiter));
  });

  // 3. Optional Footer
  if (options?.notes && options?.includeMetadataHeader === true) {
    lines.push(Array(totalCols).fill('""').join(delimiter));
    lines.push(padToCols(`Catatan: ${options.notes}`));
  }

  const csvContent = lines.join('\r\n');

  // Add UTF-8 BOM for Microsoft Excel & Google Sheets compatibility
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Professional Native Excel (.xlsx) Export Utility
 * Features:
 * - Real cell borders on ALL 4 sides (top, bottom, left, right / "kiri kanan atas bawah")
 * - Auto-calculated column widths (no squished text like "No Transa" or "Judul Lapo")
 * - Styled header background, zebra rows, and smart alignments
 * - Native Excel currency & integer formatting
 */
export async function exportToExcel(
  filename: string,
  rows: Record<string, any>[],
  options?: ExportReportOptions
) {
  if (!rows || !rows.length) {
    alert('Tidak ada data untuk diunduh.');
    return;
  }

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'WebPro Operations Platform';
  workbook.lastModifiedBy = 'WebPro Admin';
  workbook.created = new Date();

  const reportTitle = options?.reportTitle || filename.replace(/_/g, ' ');
  const sheetName = reportTitle.slice(0, 30).replace(/[:\\/?*\[\]]/g, '');

  const worksheet = workbook.addWorksheet(sheetName, {
    views: [{ showGridLines: true }],
  });

  const headers = Object.keys(rows[0]);
  const colCount = headers.length;
  const dateStr = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }) + ' WIB';

  let currentRow = 1;

  // 1. Title Banner (Merged Header across table width)
  const titleRow = worksheet.getRow(currentRow);
  titleRow.height = 28;
  worksheet.mergeCells(currentRow, 1, currentRow, Math.max(colCount, 4));
  const titleCell = worksheet.getCell(currentRow, 1);
  titleCell.value = 'WEBPRO OPERATIONS PLATFORM - LAPORAN EKSEKUTIF RESMI';
  titleCell.font = { name: 'Calibri', size: 13, bold: true, color: { argb: 'FFFFFF' } };
  titleCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: '0F172A' }, // Slate 900
  };
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  currentRow++;

  // 2. Metadata Information Block
  const metaRows = [
    [`Judul Laporan:`, reportTitle],
    [`Tanggal Ekspor:`, dateStr],
    [`Total Baris Data:`, `${rows.length} Item Record`],
  ];

  if (options?.summaryMetrics && options.summaryMetrics.length > 0) {
    options.summaryMetrics.forEach((m) => {
      metaRows.push([`${m.label}:`, String(m.value)]);
    });
  }

  metaRows.forEach(([lbl, val]) => {
    const row = worksheet.getRow(currentRow);
    row.height = 20;

    const cellA = row.getCell(1);
    cellA.value = lbl;
    cellA.font = { name: 'Calibri', size: 10, bold: true, color: { argb: '334155' } };
    cellA.alignment = { vertical: 'middle', horizontal: 'left' };

    const cellB = row.getCell(2);
    cellB.value = val;
    cellB.font = { name: 'Calibri', size: 10, color: { argb: '0F172A' } };
    cellB.alignment = { vertical: 'middle', horizontal: 'left' };

    currentRow++;
  });

  // Empty separator row
  currentRow++;

  // 3. Table Headers Row
  const tableHeaderRowIndex = currentRow;
  const headerRow = worksheet.getRow(tableHeaderRowIndex);
  headerRow.height = 26;

  headers.forEach((headerText, colIndex) => {
    const cell = headerRow.getCell(colIndex + 1);
    cell.value = headerText;
    cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '1E293B' }, // Slate 800
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    // BORDERS TOP, BOTTOM, LEFT, RIGHT
    cell.border = {
      top: { style: 'medium', color: { argb: '0F172A' } },
      left: { style: 'medium', color: { argb: '0F172A' } },
      bottom: { style: 'medium', color: { argb: '0F172A' } },
      right: { style: 'medium', color: { argb: '0F172A' } },
    };
  });

  currentRow++;

  // 4. Table Data Rows
  const startDataRow = currentRow;

  rows.forEach((rowData, rowIndex) => {
    const row = worksheet.getRow(currentRow);
    row.height = 22;
    const isEven = rowIndex % 2 === 0;

    headers.forEach((field, colIndex) => {
      const cell = row.getCell(colIndex + 1);
      let val = rowData[field];

      if (val === null || val === undefined) {
        cell.value = '';
      } else if (typeof val === 'number') {
        cell.value = val;
        const lowerF = field.toLowerCase();
        if (
          lowerF.includes('total') ||
          lowerF.includes('harga') ||
          lowerF.includes('untung') ||
          lowerF.includes('omset') ||
          lowerF.includes('bayar')
        ) {
          cell.numFmt = '"Rp "#,##0';
        } else {
          cell.numFmt = '#,##0';
        }
      } else {
        cell.value = String(val);
      }

      cell.font = { name: 'Calibri', size: 10, color: { argb: '1E293B' } };

      // Alternating Zebra Fill
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: isEven ? 'FFFFFF' : 'F8FAFC' },
      };

      // COMPLETE BORDERS (top, bottom, left, right / "kiri kanan atas bawah")
      cell.border = {
        top: { style: 'thin', color: { argb: 'CBD5E1' } },
        left: { style: 'thin', color: { argb: 'CBD5E1' } },
        bottom: { style: 'thin', color: { argb: 'CBD5E1' } },
        right: { style: 'thin', color: { argb: 'CBD5E1' } },
      };

      // Alignment Logic
      const lowerField = field.toLowerCase();
      const valStr = String(val || '');

      if (typeof val === 'number') {
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
      } else if (
        lowerField.includes('no') ||
        lowerField.includes('kode') ||
        lowerField.includes('status') ||
        lowerField.includes('waktu') ||
        lowerField.includes('tanggal') ||
        lowerField.includes('metode') ||
        lowerField.includes('stok') ||
        valStr.startsWith('#TRX') ||
        valStr.startsWith('#PAY') ||
        valStr.startsWith('SUP-') ||
        valStr.startsWith('BRG-') ||
        valStr.startsWith('BUY-')
      ) {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      } else {
        cell.alignment = { vertical: 'middle', horizontal: 'left' };
      }
    });

    currentRow++;
  });

  // 5. Total Rekapitulasi Row (Summary)
  const hasNumericFields = headers.some((h) => {
    const lower = h.toLowerCase();
    return lower.includes('total') || lower.includes('untung') || lower.includes('harga') || lower.includes('omset');
  });

  if (hasNumericFields && rows.length > 1) {
    const totalRow = worksheet.getRow(currentRow);
    totalRow.height = 24;

    headers.forEach((field, colIndex) => {
      const cell = totalRow.getCell(colIndex + 1);

      cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: '0F172A' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'E2E8F0' }, // Slate 200
      };

      cell.border = {
        top: { style: 'thin', color: { argb: '475569' } },
        left: { style: 'thin', color: { argb: 'CBD5E1' } },
        bottom: { style: 'double', color: { argb: '0F172A' } }, // Double bottom line for accounting total
        right: { style: 'thin', color: { argb: 'CBD5E1' } },
      };

      if (colIndex === 0) {
        cell.value = 'TOTAL REKAPITULASI';
        cell.alignment = { vertical: 'middle', horizontal: 'left' };
      } else {
        const lower = field.toLowerCase();
        if (lower.includes('total') || lower.includes('untung') || lower.includes('harga') || lower.includes('omset')) {
          const colLetter = String.fromCharCode(65 + colIndex);
          cell.value = { formula: `SUM(${colLetter}${startDataRow}:${colLetter}${currentRow - 1})` };
          cell.numFmt = '"Rp "#,##0';
          cell.alignment = { vertical: 'middle', horizontal: 'right' };
        } else if (lower.includes('jumlah') || lower.includes('stok')) {
          const colLetter = String.fromCharCode(65 + colIndex);
          cell.value = { formula: `SUM(${colLetter}${startDataRow}:${colLetter}${currentRow - 1})` };
          cell.numFmt = '#,##0';
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
        } else {
          cell.value = '';
        }
      }
    });

    currentRow++;
  }

  // 6. Notes Footer
  if (options?.notes) {
    currentRow++;
    const noteRow = worksheet.getRow(currentRow);
    noteRow.height = 20;
    const noteCell = noteRow.getCell(1);
    noteCell.value = `Catatan: ${options.notes}`;
    noteCell.font = { name: 'Calibri', size: 9, italic: true, color: { argb: '64748B' } };
  }

  // 7. Auto Column Widths (Prevents any text clipping or column squishing)
  headers.forEach((headerText, colIndex) => {
    let maxLen = headerText.length;

    rows.forEach((r) => {
      const val = r[headerText];
      if (val !== null && val !== undefined) {
        const strVal =
          typeof val === 'number' &&
          (headerText.toLowerCase().includes('total') || headerText.toLowerCase().includes('harga'))
            ? `Rp ${val.toLocaleString('id-ID')}`
            : String(val);
        if (strVal.length > maxLen) {
          maxLen = strVal.length;
        }
      }
    });

    const col = worksheet.getColumn(colIndex + 1);
    col.width = Math.max(maxLen + 6, 18); // Generous width + padding so no headers ever clip
  });

  // Generate and trigger download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().slice(0, 10)}.xlsx`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Universal Export Function
 * Can export Excel (.xlsx), CSV (.csv), or both.
 */
export async function exportReport(
  filename: string,
  rows: Record<string, any>[],
  options?: ExportReportOptions,
  format: 'excel' | 'csv' | 'both' = 'excel'
) {
  if (format === 'excel' || format === 'both') {
    await exportToExcel(filename, rows, options);
  }
  if (format === 'csv' || format === 'both') {
    exportToCSV(filename, rows, options);
  }
}

