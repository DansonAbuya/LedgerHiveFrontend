import * as XLSX from 'xlsx';

const EXCEL_MIME =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

export function isExcelFile(file: File): boolean {
  return (
    file.name.endsWith('.xlsx') ||
    file.type === EXCEL_MIME
  );
}

export interface InvoiceRow {
  customerId: string;
  amount: number;
  dueDate: string;
}

export interface CustomerRow {
  name: string;
  email?: string;
  phone?: string;
}

function normalizeHeader(s: string): string {
  return String(s ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function parseSheetToRows<T>(workbook: XLSX.WorkBook, mapRow: (row: Record<string, unknown>) => T | null): T[] {
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!sheet) return [];
  const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
  const result: T[] = [];
  for (const row of data) {
    const normalized: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(row)) {
      normalized[normalizeHeader(k)] = v;
    }
    const mapped = mapRow(normalized);
    if (mapped != null) result.push(mapped);
  }
  return result;
}

export function parseExcelInvoices(buffer: ArrayBuffer): InvoiceRow[] {
  const workbook = XLSX.read(buffer, { type: 'array' });
  return parseSheetToRows(workbook, (row) => {
    const customerId = String(row['customerid'] ?? row['customer id'] ?? row['customer_id'] ?? '').trim();
    const amountRaw = row['amount'] ?? row['amount (kes)'] ?? row['amount(kes)'];
    const amount = typeof amountRaw === 'number' ? amountRaw : Number(String(amountRaw).replace(/[^0-9.-]/g, '')) || 0;
    let dueDate = String(row['duedate'] ?? row['due date'] ?? row['due_date'] ?? '').trim();
    const dueNum = row['duedate'] ?? row['due date'] ?? row['due_date'];
    if (typeof dueNum === 'number' && dueNum > 0) {
      const date = new Date((dueNum - 25569) * 86400 * 1000);
      if (!isNaN(date.getTime())) dueDate = date.toISOString().slice(0, 10);
    }
    if (!customerId || amount <= 0 || !dueDate) return null;
    return { customerId, amount, dueDate };
  });
}

export function parseExcelCustomers(buffer: ArrayBuffer): CustomerRow[] {
  const workbook = XLSX.read(buffer, { type: 'array' });
  return parseSheetToRows(workbook, (row) => {
    const name = String(row['name'] ?? row['customer name'] ?? row['customer_name'] ?? '').trim();
    if (!name) return null;
    const email = String(row['email'] ?? '').trim() || undefined;
    const phone = String(row['phone'] ?? row['phone number'] ?? row['phone_number'] ?? '').trim() || undefined;
    return { name, email, phone };
  });
}
