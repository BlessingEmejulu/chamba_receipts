"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { usePollarAuth } from "@/hooks/usePollarAuth";
import { listPaymentRecords, exportPaymentsToCsv, PaymentRecord } from "@/lib/storage";
import { formatAmount } from "@/lib/stellar";
import { Mark, Eyebrow } from "@/components/blackout";
import {
  History,
  Search,
  FileText,
  ChevronRight,
  ShieldCheck,
  PlusCircle,
  Download,
  ArrowRight,
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
      <div className="mx-auto flex max-w-md flex-1 flex-col items-center justify-center px-4 py-24 text-center">
        <span className="flex h-12 w-12 items-center justify-center border border-line-2 bg-surface-2">
          <History className="h-5 w-5 text-teal" aria-hidden="true" />
        </span>
        <h1 className="bo-display mt-7 text-3xl text-ink">Sign in to view income history</h1>
        <p className="mt-4 text-sm leading-relaxed text-ink-2">
          Connect your Pollar wallet to review past transactions, access official receipts,
          and audit your verified income.
        </p>
        <button
          onClick={login}
          className="bo-btn bo-btn-primary mt-8 px-6 py-3.5 text-xs uppercase tracking-[0.1em]"
        >
          <span>Connect Pollar wallet</span>
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    );
  }

  return (
    <div className="bo-rails mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col gap-6 border-b border-line-2 pb-8 md:flex-row md:items-end md:justify-between">
        <div>
          <Eyebrow live>Verifiable track record</Eyebrow>
          <h1 className="bo-display mt-5 text-3xl text-ink sm:text-4xl">
            Your work, recorded.
          </h1>
          <p className="mt-3 max-w-lg text-sm text-ink-2">
            Every payment adds to your income story. Auditable, non-custodial, stored on
            Stellar.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/receive"
            className="bo-btn bo-btn-primary px-5 py-3 text-xs uppercase tracking-[0.1em]"
          >
            <PlusCircle className="h-4 w-4" aria-hidden="true" />
            <span>New request</span>
          </Link>
          <Link
            href="/report"
            className="bo-btn bo-btn-ghost px-5 py-3 text-xs uppercase tracking-[0.1em]"
          >
            <FileText className="h-4 w-4" aria-hidden="true" />
            <span>Statement</span>
          </Link>
          <button
            onClick={handleExportCsv}
            disabled={filteredRecords.length === 0}
            className="bo-btn bo-btn-ghost px-5 py-3 text-xs uppercase tracking-[0.1em]"
            title="Download CSV statement"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filter rail */}
      <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:w-80">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-4"
            aria-hidden="true"
          />
          <input
            type="search"
            placeholder="Search description, customer, ID"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="Search income records"
            className="bo-field py-2.5 pl-10"
          />
        </div>

        <div className="flex items-center gap-4">
          <div className="bo-segment" role="group" aria-label="Filter by currency">
            {["ALL", "USDC", "XLM"].map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setSelectedCurrency(c)}
                data-active={selectedCurrency === c}
                aria-pressed={selectedCurrency === c}
              >
                {c}
              </button>
            ))}
          </div>

          <span className="bo-label-sm hidden sm:inline" aria-live="polite">
            {filteredRecords.length} records
          </span>
        </div>
      </div>

      {/* Cumulative readout */}
      <div className="mt-6 grid grid-cols-1 gap-px bg-line-2 sm:grid-cols-3">
        <div className="bg-surface-1 px-5 py-4">
          <div className="bo-label-sm">Filter total &middot; USDC</div>
          <div className="bo-num mt-2 text-lg font-medium text-ink">
            {formatAmount(totalUsdc)} <span className="text-teal">USDC</span>
          </div>
        </div>
        <div className="bg-surface-1 px-5 py-4">
          <div className="bo-label-sm">Filter total &middot; XLM</div>
          <div className="bo-num mt-2 text-lg font-medium text-ink">
            {formatAmount(totalXlm)} <span className="text-gold">XLM</span>
          </div>
        </div>
        <div className="bg-surface-1 px-5 py-4">
          <div className="bo-label-sm">Records in view</div>
          <div className="bo-num mt-2 text-lg font-medium text-ink">
            {filteredRecords.length}{" "}
            <span className="text-ink-3">/ {records.length}</span>
          </div>
        </div>
      </div>

      {/* Ledger */}
      <section className="bo-panel mt-6">
        {filteredRecords.length === 0 ? (
          <div className="px-6 py-24 text-center">
            <span className="mx-auto flex h-12 w-12 items-center justify-center border border-line-2 bg-surface-3">
              <History className="h-5 w-5 text-ink-3" aria-hidden="true" />
            </span>
            <h3 className="bo-heading mt-6 text-lg font-medium text-ink">
              {records.length === 0
                ? "Your first payment starts your story."
                : "No records match this filter."}
            </h3>
            <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-ink-3">
              {records.length === 0
                ? "Your payment history appears here once you receive your first client transfer."
                : "Try a different search term or currency filter."}
            </p>
            {records.length === 0 && (
              <Link
                href="/receive"
                className="bo-btn bo-btn-primary mt-8 px-5 py-3 text-xs uppercase tracking-[0.1em]"
              >
                <PlusCircle className="h-4 w-4" aria-hidden="true" />
                <span>Create payment request</span>
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="hidden border-b border-line-2 px-6 py-3 sm:grid sm:grid-cols-12 sm:gap-4">
              <div className="bo-label-sm sm:col-span-6">Service &amp; customer</div>
              <div className="bo-label-sm sm:col-span-3 sm:text-right">Amount</div>
              <div className="bo-label-sm sm:col-span-3 sm:text-right">Proof</div>
            </div>

            <ul className="divide-y divide-line-1">
              {filteredRecords.map((record) => {
                const formattedDate = new Date(
                  record.paidAt || record.createdAt
                ).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                });

                return (
                  <li
                    key={record.id}
                    className="bo-hover-row grid grid-cols-1 gap-4 px-6 py-5 sm:grid-cols-12 sm:items-center"
                  >
                    <div className="flex min-w-0 items-start gap-4 sm:col-span-6">
                      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center border border-teal/30 bg-teal/8">
                        <ShieldCheck className="h-4 w-4 text-teal" aria-hidden="true" />
                      </span>
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium text-ink">
                          {record.description}
                        </div>
                        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                          <span className="text-2xs text-ink-2">
                            {record.payerName || "Customer"}
                          </span>
                          <span className="bo-num text-2xs text-ink-3">
                            {formattedDate}
                          </span>
                          <span className="bo-code text-2xs text-ink-3">{record.id}</span>
                        </div>
                      </div>
                    </div>

                    <div className="sm:col-span-3 sm:text-right">
                      <div className="bo-num text-base font-medium text-ink">
                        +{formatAmount(record.amount)}{" "}
                        <span className="text-teal">{record.currency}</span>
                      </div>
                      <span className="bo-chip bo-chip-ok mt-1.5">Paid</span>
                    </div>

                    <div className="flex items-center gap-px bg-line-2 sm:col-span-3 sm:justify-end sm:bg-transparent sm:gap-2">
                      <Link
                        href={`/receipt/${record.id}`}
                        className="bo-btn bo-btn-secondary px-3.5 py-2 text-2xs uppercase tracking-[0.1em]"
                      >
                        <FileText className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Receipt</span>
                      </Link>
                      <Link
                        href={`/transaction/${record.id}`}
                        className="bo-btn bo-btn-secondary h-9 w-9"
                        title="Stellar details"
                      >
                        <ChevronRight className="h-4 w-4" aria-hidden="true" />
                        <span className="sr-only">Ledger detail {record.id}</span>
                      </Link>
                    </div>
                  </li>
                );
              })}
            </ul>

            <div className="flex items-center gap-3 border-t border-line-2 px-6 py-3.5">
              <Mark />
              <span className="bo-label-sm">
                End of ledger &middot; {filteredRecords.length} verified records
              </span>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
