"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { usePollarAuth } from "@/hooks/usePollarAuth";
import { listPaymentRecords, exportPaymentsToCsv, PaymentRecord } from "@/lib/storage";
import { formatAmount, shortAddress, getExplorerUrl } from "@/lib/stellar";
import {
  History,
  Search,
  Filter,
  FileText,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  PlusCircle,
  AlertCircle,
  Download,
} from "lucide-react";

export default function IncomeHistoryPage() {
  const { user, isAuthenticated, login } = usePollarAuth();
  const [records, setRecords] = useState<PaymentRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCurrency, setSelectedCurrency] = useState<string>("ALL");

  const loadRecords = () => {
    const list = listPaymentRecords(user?.address);
    setRecords(list);
  };

  const handleExportCsv = () => {
    if (filteredRecords.length === 0) return;
    const csvContent = exportPaymentsToCsv(filteredRecords);
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `chamba-income-statement-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    loadRecords();
    if (typeof window !== "undefined") {
      window.addEventListener("storage_chamba_updated", loadRecords);
      return () => window.removeEventListener("storage_chamba_updated", loadRecords);
    }
  }, [user?.address]);

  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      // currency filter
      if (selectedCurrency !== "ALL" && r.currency !== selectedCurrency) {
        return false;
      }
      // search filter
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const descMatch = r.description.toLowerCase().includes(q);
        const payerMatch = (r.payerName || "").toLowerCase().includes(q);
        const idMatch = r.id.toLowerCase().includes(q);
        const txMatch = (r.transactionId || "").toLowerCase().includes(q);
        return descMatch || payerMatch || idMatch || txMatch;
      }
      return true;
    });
  }, [records, selectedCurrency, searchTerm]);

  // Total for filtered records
  const totalUsdc = filteredRecords
    .filter((r) => r.currency === "USDC" && r.status === "successful")
    .reduce((acc, cur) => acc + (parseFloat(cur.amount) || 0), 0);

  const totalXlm = filteredRecords
    .filter((r) => r.currency === "XLM" && r.status === "successful")
    .reduce((acc, cur) => acc + (parseFloat(cur.amount) || 0), 0);

  if (!isAuthenticated) {
    return (
      <div className="mx-auto flex max-w-md flex-1 flex-col items-center justify-center px-4 py-20 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 mb-4">
          <History className="h-7 w-7" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Sign In to View Income History
        </h1>
        <p className="mt-2 text-sm text-slate-600 leading-relaxed">
          Connect your Pollar wallet to review past transactions, receipts, and track your verified freelance income.
        </p>
        <button
          onClick={login}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 active:scale-[0.98] transition-all"
        >
          <span>Connect Pollar Wallet</span>
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 w-full">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-6 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Income History
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Auditable log of all confirmed payments received to your Pollar address.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/receive"
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 active:scale-[0.98] transition-all"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Receive Payment</span>
          </Link>
          <Link
            href="/report"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all"
          >
            <FileText className="h-4 w-4 text-slate-500" />
            <span>Monthly Report</span>
          </Link>
          <button
            onClick={handleExportCsv}
            disabled={filteredRecords.length === 0}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-2xs"
            title="Download CSV Statement"
          >
            <Download className="h-4 w-4 text-slate-500" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="mb-6 flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search description, customer, ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600 shadow-2xs"
          />
        </div>

        {/* Currency Tabs */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="inline-flex rounded-xl border border-slate-200 bg-slate-100/70 p-1 text-xs font-semibold">
            {["ALL", "USDC", "XLM"].map((c) => (
              <button
                key={c}
                onClick={() => setSelectedCurrency(c)}
                className={`rounded-lg px-3 py-1.5 transition-all ${
                  selectedCurrency === c
                    ? "bg-white text-slate-900 shadow-2xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          <span className="hidden sm:inline-block text-xs font-medium text-slate-500 ml-2">
            Showing {filteredRecords.length} records
          </span>
        </div>
      </div>

      {/* Filter Total Summary Banner */}
      <div className="mb-6 rounded-2xl border border-slate-200 bg-white px-6 py-4 flex flex-wrap items-center justify-between gap-4 shadow-2xs">
        <div className="text-xs text-slate-500 font-medium">
          Filter Totals:
        </div>
        <div className="flex items-center gap-6 text-sm">
          <div>
            <span className="text-slate-500 text-xs mr-1.5">USDC Total:</span>
            <span className="font-bold text-slate-900">{formatAmount(totalUsdc)} USDC</span>
          </div>
          {totalXlm > 0 && (
            <div>
              <span className="text-slate-500 text-xs mr-1.5">XLM Total:</span>
              <span className="font-bold text-slate-900">{formatAmount(totalXlm)} XLM</span>
            </div>
          )}
        </div>
      </div>

      {/* Payments Table / List */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
        {filteredRecords.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-3">
              <AlertCircle className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900">
              No payments found
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Your payment history will appear here after you receive your first payment.
            </p>
            <Link
              href="/receive"
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              <span>Create Payment Request</span>
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredRecords.map((record) => {
              const formattedDate = new Date(record.paidAt || record.createdAt).toLocaleDateString(
                "en-US",
                {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                }
              );

              return (
                <div
                  key={record.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-5 sm:px-6 hover:bg-slate-50/70 transition-colors gap-4"
                >
                  <div className="flex items-start sm:items-center gap-3.5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                      <ShieldCheck className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900 text-sm">
                        {record.description}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-0.5">
                        <span className="font-medium text-slate-700">
                          {record.payerName || "Customer"}
                        </span>
                        <span>•</span>
                        <span>{formattedDate}</span>
                        <span>•</span>
                        <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">
                          {record.id}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-5">
                    <div className="text-right">
                      <div className="text-base font-bold text-slate-900">
                        +{formatAmount(record.amount)} {record.currency}
                      </div>
                      <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200/60">
                        PAID
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/receipt/${record.id}`}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                        title="View Receipt"
                      >
                        <FileText className="h-3.5 w-3.5 text-slate-500" />
                        <span>Receipt</span>
                      </Link>

                      <Link
                        href={`/transaction/${record.id}`}
                        className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
                        title="Transaction details"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
