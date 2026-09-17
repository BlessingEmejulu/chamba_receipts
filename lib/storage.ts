"use client";

/**
 * Storage and Data Modeling Layer for Chamba Receipts
 */

export interface PaymentRecord {
  id: string; // Receipt ID e.g. "CR-92A1F7"
  paymentRequestId: string;
  transactionId: string; // Stellar transaction hash
  workerAddress: string;
  workerName?: string;
  payerAddress?: string | null;
  payerName?: string | null;
  description: string;
  amount: string;
  currency: "USDC" | "XLM";
  status: "pending" | "processing" | "successful" | "failed" | "cancelled";
  memo: string;
  createdAt: string; // ISO-8601
  paidAt?: string | null; // ISO-8601
}

export interface PaymentRequest {
  id: string; // Request ID e.g. "REQ-84F2B1"
  workerAddress: string;
  workerName?: string;
  customerName?: string;
  description: string;
  amount: string;
  currency: "USDC" | "XLM";
  paymentReference?: string;
  memo: string; // Short Stellar text memo (e.g. CR-84F2B1, max 28 bytes)
  status: "pending" | "processing" | "successful" | "failed" | "cancelled";
  createdAt: string;
  confirmedPaymentId?: string;
}

const REQUESTS_KEY = "chamba_payment_requests_v1";
const PAYMENTS_KEY = "chamba_payment_records_v1";

export function generateId(prefix: string): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix}-${result}`;
}

function safeGetItem<T>(key: string, defaultValue: T): T {
  if (typeof window === "undefined") return defaultValue;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function safeSetItem<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new Event("storage_chamba_updated"));
  } catch {
    // ignore quota errors
  }
}

// ================= Payment Requests =================

export function listPaymentRequests(workerAddress?: string): PaymentRequest[] {
  const all = safeGetItem<PaymentRequest[]>(REQUESTS_KEY, []);
  if (!workerAddress) return all;
  return all.filter((r) => r.workerAddress.toLowerCase() === workerAddress.toLowerCase());
}

export function getPaymentRequest(id: string): PaymentRequest | null {
  const all = safeGetItem<PaymentRequest[]>(REQUESTS_KEY, []);
  return all.find((r) => r.id === id) ?? null;
}

export function savePaymentRequest(request: PaymentRequest): void {
  const all = safeGetItem<PaymentRequest[]>(REQUESTS_KEY, []);
  const index = all.findIndex((r) => r.id === request.id);
  if (index >= 0) {
    all[index] = request;
  } else {
    all.unshift(request);
  }
  safeSetItem(REQUESTS_KEY, all);
}

export function updatePaymentRequestStatus(
  id: string,
  status: PaymentRequest["status"],
  confirmedPaymentId?: string
): PaymentRequest | null {
  const all = safeGetItem<PaymentRequest[]>(REQUESTS_KEY, []);
  const req = all.find((r) => r.id === id);
  if (!req) return null;
  req.status = status;
  if (confirmedPaymentId) req.confirmedPaymentId = confirmedPaymentId;
  safeSetItem(REQUESTS_KEY, all);
  return req;
}

// ================= Confirmed Payment Records =================

export function listPaymentRecords(workerAddress?: string): PaymentRecord[] {
  const all = safeGetItem<PaymentRecord[]>(PAYMENTS_KEY, []);
  const filtered = workerAddress
    ? all.filter((p) => p.workerAddress.toLowerCase() === workerAddress.toLowerCase())
    : all;
  // Always sort newest first
  return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getPaymentRecord(id: string): PaymentRecord | null {
  const all = safeGetItem<PaymentRecord[]>(PAYMENTS_KEY, []);
  return all.find((p) => p.id === id) ?? null;
}

export function getPaymentRecordByRequestId(paymentRequestId: string): PaymentRecord | null {
  const all = safeGetItem<PaymentRecord[]>(PAYMENTS_KEY, []);
  return all.find((p) => p.paymentRequestId === paymentRequestId) ?? null;
}

export function savePaymentRecord(record: PaymentRecord): void {
  const all = safeGetItem<PaymentRecord[]>(PAYMENTS_KEY, []);
  const index = all.findIndex((p) => p.id === record.id);
  if (index >= 0) {
    all[index] = record;
  } else {
    all.unshift(record);
  }
  safeSetItem(PAYMENTS_KEY, all);
}

// ================= Statistics & Aggregations =================

export interface DashboardStats {
  totalUsdc: number;
  totalXlm: number;
  paymentCount: number;
  thisMonthUsdc: number;
  thisMonthXlm: number;
  averagePaymentUsdc: number;
  recentPayments: PaymentRecord[];
}

export function getDashboardStats(workerAddress?: string): DashboardStats {
  const records = listPaymentRecords(workerAddress).filter((r) => r.status === "successful");

  let totalUsdc = 0;
  let totalXlm = 0;
  let thisMonthUsdc = 0;
  let thisMonthXlm = 0;
  let usdcCount = 0;

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  for (const r of records) {
    const amountNum = parseFloat(r.amount) || 0;
    const date = new Date(r.paidAt || r.createdAt);
    const isThisMonth = date.getFullYear() === currentYear && date.getMonth() === currentMonth;

    if (r.currency === "XLM") {
      totalXlm += amountNum;
      if (isThisMonth) thisMonthXlm += amountNum;
    } else {
      totalUsdc += amountNum;
      usdcCount++;
      if (isThisMonth) thisMonthUsdc += amountNum;
    }
  }

  const averagePaymentUsdc = usdcCount > 0 ? totalUsdc / usdcCount : 0;

  return {
    totalUsdc,
    totalXlm,
    paymentCount: records.length,
    thisMonthUsdc,
    thisMonthXlm,
    averagePaymentUsdc,
    recentPayments: records.slice(0, 5),
  };
}

export interface MonthlyBreakdownItem {
  monthKey: string; // e.g. "2026-09"
  monthName: string; // e.g. "September 2026"
  count: number;
  totalUsdc: number;
  totalXlm: number;
}

export function getMonthlyBreakdown(workerAddress?: string): MonthlyBreakdownItem[] {
  const records = listPaymentRecords(workerAddress).filter((r) => r.status === "successful");
  const monthMap: Record<string, MonthlyBreakdownItem> = {};

  for (const r of records) {
    const d = new Date(r.paidAt || r.createdAt);
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const monthName = d.toLocaleDateString("en-US", { month: "long", year: "numeric" });

    if (!monthMap[monthKey]) {
      monthMap[monthKey] = {
        monthKey,
        monthName,
        count: 0,
        totalUsdc: 0,
        totalXlm: 0,
      };
    }

    const amt = parseFloat(r.amount) || 0;
    monthMap[monthKey].count += 1;
    if (r.currency === "XLM") {
      monthMap[monthKey].totalXlm += amt;
    } else {
      monthMap[monthKey].totalUsdc += amt;
    }
  }

  return Object.values(monthMap).sort((a, b) => b.monthKey.localeCompare(a.monthKey));
}
