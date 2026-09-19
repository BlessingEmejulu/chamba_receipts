"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { usePollarAuth } from "@/hooks/usePollarAuth";
import {
  listPaymentRecords,
  exportPaymentsToCsv,
  syncOnChainPayments,
  PaymentRecord,
} from "@/lib/storage";
import { formatAmount, shortAddress } from "@/lib/stellar";
import {
  History,
  Search,
  FileText,
  ChevronRight,
  ShieldCheck,
  PlusCircle,
  AlertCircle,
  Download,
  Sparkles,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";

export default function IncomeHistoryPage() {
  const { user, isAuthenticated, login } = usePollarAuth();
  const [records, setRecords] = useState<PaymentRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCurrency, setSelectedCurrency] = useState<string>("ALL");
  const [isSyncing, setIsSyncing] = useState(false);

  const loadRecords = useCallback(() => {
    const list = listPaymentRecords(user?.address);
    setRecords(list);
  }, [user?.address]);

  const handleSync = useCallback(async () => {
    if (!user?.address) return;
    setIsSyncing(true);
    try {
      await syncOnChainPayments(user.address);
      loadRecords();
    } finally {
      setIsSyncing(false);
    }
  }, [user?.address, loadRecords]);

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
    if (user?.address) {
      void handleSync();
    }

    if (typeof window !== "undefined") {
      window.addEventListener("storage_chamba_updated", loadRecords);
      return () => window.removeEventListener("storage_chamba_updated", loadRecords);
    }
  }, [user?.address, loadRecords, handleSync]);

  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      if (selectedCurrency !== "ALL" && r.currency !== selectedCurrency) {
        return false;
      }
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

  const totalUsdc = filteredRecords
    .filter((r) => r.currency === "USDC" && r.status === "successful")
    .reduce((acc, cur) => acc + (parseFloat(cur.amount) || 0), 0);

  const totalXlm = filteredRecords
    .filter((r) => r.currency === "XLM" && r.status === "successful")
    .reduce((acc, cur) => acc + (parseFloat(cur.amount) || 0), 0);

  if (!isAuthenticated) {
    return (
      <div className="mx-auto flex max-w-md flex-1 flex-col items-center justify-center px-4 py-20 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#075E54]/10 text-[#075E54] mb-6">
          <History className="h-8 w-8 text-[#075E54]" />
        </div>
        <h1 className="font-heading text-3xl font-black tracking-tight text-[#102A2A]">
          Sign In to View Income History
        </h1>
        <p className="mt-3 text-sm text-[#5F6F6D] leading-relaxed">
          Connect your Pollar wallet to review past transactions, access official receipts, and audit your verified income.
        </p>
        <button
          onClick={login}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#075E54] px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#075E54]/20 hover:bg-[#064e46] active:scale-[0.98] transition-all cursor-pointer"
        >
          <Sparkles className="h-4 w-4 text-[#F2A900]" />
          <span>Connect Pollar Wallet</span>
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 w-full">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-[#075E54]/10 pb-6 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-bold text-[#075E54] uppercase tracking-wider mb-1.5">
            <span className="h-2 w-2 rounded-full bg-[#16A085]" />
            Verifiable Track Record
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl font-black tracking-tight text-[#102A2A]">
            Your work, recorded.
          </h1>
          <p className="text-sm text-[#5F6F6D] mt-1">
            Every payment adds to your income story. Auditable, non-custodial, and stored on Stellar.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleSync}
            disabled={isSyncing}
            className="inline-flex items-center gap-2 rounded-xl border border-[#075E54]/20 bg-white px-4 py-3 text-sm font-semibold text-[#102A2A] hover:bg-[#F8F7F2] transition-all shadow-2xs disabled:opacity-60 cursor-pointer"
            title="Fetch latest on-chain payments from Stellar Horizon"
          >
            <RefreshCw className={`h-4 w-4 text-[#075E54] ${isSyncing ? "animate-spin" : ""}`} />
            <span>{isSyncing ? "Syncing..." : "Sync On-Chain"}</span>
          </button>
          <Link
            href="/receive"
            className="inline-flex items-center gap-2 rounded-xl bg-[#075E54] px-5 py-3 text-sm font-bold text-white shadow-md shadow-[#075E54]/20 hover:bg-[#064e46] active:scale-[0.98] transition-all"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Create Request</span>
          </Link>
          <Link
            href="/report"
            className="inline-flex items-center gap-2 rounded-xl border border-[#075E54]/20 bg-white px-5 py-3 text-sm font-semibold text-[#102A2A] hover:bg-[#F8F7F2] transition-all shadow-2xs"
          >
            <FileText className="h-4 w-4 text-[#075E54]" />
            <span>Income Statement</span>
          </Link>
          <button
            onClick={handleExportCsv}
            disabled={filteredRecords.length === 0}
            className="inline-flex items-center gap-2 rounded-xl border border-[#075E54]/20 bg-white px-5 py-3 text-sm font-semibold text-[#102A2A] hover:bg-[#F8F7F2] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-2xs cursor-pointer"
            title="Download CSV Statement"
          >
            <Download className="h-4 w-4 text-[#075E54]" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#5F6F6D]" />
          <input
            type="text"
            placeholder="Search description, customer, ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-sm text-[#102A2A] placeholder:text-[#5F6F6D] focus:border-[#075E54] focus:outline-none focus:ring-2 focus:ring-[#075E54]/20 shadow-2xs transition-all"
          />
        </div>

        {/* Currency Tabs */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="inline-flex rounded-xl border border-[#075E54]/15 bg-white p-1 text-xs font-bold shadow-2xs">
            <button
              onClick={() => setSelectedCurrency("ALL")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                selectedCurrency === "ALL"
                  ? "bg-[#075E54] text-white shadow-xs"
                  : "text-[#5F6F6D] hover:text-[#102A2A]"
              }`}
            >
              All Assets
            </button>
            <button
              onClick={() => setSelectedCurrency("USDC")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                selectedCurrency === "USDC"
                  ? "bg-[#075E54] text-white shadow-xs"
                  : "text-[#5F6F6D] hover:text-[#102A2A]"
              }`}
            >
              USDC Only
            </button>
            <button
              onClick={() => setSelectedCurrency("XLM")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                selectedCurrency === "XLM"
                  ? "bg-[#075E54] text-white shadow-xs"
                  : "text-[#5F6F6D] hover:text-[#102A2A]"
              }`}
            >
              XLM Only
            </button>
          </div>
        </div>
      </div>

      {/* Aggregate Overview Card */}
      <div className="mb-6 rounded-2xl border border-[#075E54]/15 bg-white p-5 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <div>
            <span className="text-2xs font-bold uppercase tracking-wider text-[#5F6F6D] block">
              Filtered Volume
            </span>
            <div className="font-heading text-xl sm:text-2xl font-black text-[#102A2A] mt-0.5">
              ${formatAmount(totalUsdc)} USDC
              {totalXlm > 0 && (
                <span className="text-sm font-bold text-[#5F6F6D] ml-2">
                  + {formatAmount(totalXlm)} XLM
                </span>
              )}
            </div>
          </div>

          <div className="h-8 w-px bg-[#075E54]/10 hidden sm:block" />

          <div>
            <span className="text-2xs font-bold uppercase tracking-wider text-[#5F6F6D] block">
              Matching Records
            </span>
            <div className="font-heading text-xl sm:text-2xl font-black text-[#102A2A] mt-0.5">
              {filteredRecords.length}
            </div>
          </div>
        </div>

        <div className="text-xs text-[#5F6F6D] font-medium flex items-center gap-1.5">
          <ShieldCheck className="h-4 w-4 text-[#16A085]" />
          <span>Synced directly with Stellar Horizon ledger</span>
        </div>
      </div>

      {/* Payments Table / List */}
      <div className="rounded-3xl border border-[#075E54]/15 bg-white shadow-sm overflow-hidden">
        {filteredRecords.length === 0 ? (
          <div className="px-6 py-20 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#075E54]/10 text-[#075E54] mb-4">
              <Sparkles className="h-7 w-7 text-[#F2A900]" />
            </div>
            <h3 className="font-heading text-lg font-bold text-[#102A2A]">
              {isSyncing ? "Checking Stellar ledger for incoming payments..." : "Your first payment starts your story."}
            </h3>
            <p className="text-xs sm:text-sm text-[#5F6F6D] mt-2 max-w-sm mx-auto leading-relaxed">
              Your payment history will appear here once you receive your first client transfer.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={handleSync}
                disabled={isSyncing}
                className="inline-flex items-center gap-2 rounded-xl border border-[#075E54]/20 bg-white px-5 py-3 text-xs sm:text-sm font-semibold text-[#102A2A] hover:bg-[#F8F7F2] transition-all shadow-2xs"
              >
                <RefreshCw className={`h-4 w-4 text-[#075E54] ${isSyncing ? "animate-spin" : ""}`} />
                <span>Check Stellar Horizon</span>
              </button>
              <Link
                href="/receive"
                className="inline-flex items-center gap-2 rounded-xl bg-[#075E54] px-5 py-3 text-xs sm:text-sm font-bold text-white shadow-md shadow-[#075E54]/20 hover:bg-[#064e46]"
              >
                <PlusCircle className="h-4 w-4" />
                <span>Create Payment Request</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-[#075E54]/10">
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
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-5 sm:px-8 hover:bg-[#F8F7F2]/60 transition-colors gap-4"
                >
                  <div className="flex items-start sm:items-center gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#16A085]/15 text-[#075E54]">
                      <ShieldCheck className="h-6 w-6 text-[#16A085]" />
                    </div>
                    <div>
                      <div className="font-heading font-bold text-[#102A2A] text-sm sm:text-base">
                        {record.description}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-[#5F6F6D] mt-0.5">
                        <span className="font-semibold text-[#102A2A]">
                          {record.payerName || "Customer"}
                        </span>
                        <span>&bull;</span>
                        <span>{formattedDate}</span>
                        <span>&bull;</span>
                        <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-2xs text-[#5F6F6D]">
                          {record.id}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-5">
                    <div className="text-right">
                      <div className="font-heading text-base sm:text-lg font-black text-[#102A2A]">
                        +{formatAmount(record.amount)} {record.currency}
                      </div>
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#16A085]/15 px-2 py-0.5 text-2xs font-bold text-[#075E54] border border-[#16A085]/30">
                        <CheckCircle2 className="h-3 w-3 text-[#16A085]" />
                        CONFIRMED
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/receipt/${record.id}`}
                        className="min-h-[38px] inline-flex items-center gap-1.5 rounded-xl border border-[#075E54]/20 bg-white px-3.5 py-2 text-xs font-bold text-[#075E54] hover:bg-[#075E54] hover:text-white transition-all shadow-2xs active:scale-95"
                        title="View Official Receipt"
                      >
                        <FileText className="h-3.5 w-3.5" />
                        <span>Receipt</span>
                      </Link>

                      <Link
                        href={`/transaction/${record.id}`}
                        className="min-h-[38px] min-w-[38px] inline-flex items-center justify-center rounded-xl border border-[#075E54]/20 bg-white text-[#5F6F6D] hover:bg-slate-100 hover:text-[#102A2A] transition-all shadow-2xs active:scale-95"
                        title="Stellar details"
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
