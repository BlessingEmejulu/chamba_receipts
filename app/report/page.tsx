"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePollarAuth } from "@/hooks/usePollarAuth";
import {
  getDashboardStats,
  getMonthlyBreakdown,
  DashboardStats,
  MonthlyBreakdownItem,
} from "@/lib/storage";
import { formatAmount, shortAddress } from "@/lib/stellar";
import {
  FileText,
  Printer,
  Calendar,
  Layers,
  DollarSign,
  TrendingUp,
  ShieldCheck,
  ArrowLeft,
  AlertCircle,
  PlusCircle,
} from "lucide-react";

export default function IncomeReportPage() {
  const { user, isAuthenticated, login } = usePollarAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsdc: 0,
    totalXlm: 0,
    paymentCount: 0,
    thisMonthUsdc: 0,
    thisMonthXlm: 0,
    averagePaymentUsdc: 0,
    recentPayments: [],
  });
  const [breakdown, setBreakdown] = useState<MonthlyBreakdownItem[]>([]);

  const loadData = () => {
    setStats(getDashboardStats(user?.address));
    setBreakdown(getMonthlyBreakdown(user?.address));
  };

  useEffect(() => {
    loadData();
    if (typeof window !== "undefined") {
      window.addEventListener("storage_chamba_updated", loadData);
      return () => window.removeEventListener("storage_chamba_updated", loadData);
    }
  }, [user?.address]);

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="mx-auto flex max-w-md flex-1 flex-col items-center justify-center px-4 py-20 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 mb-4">
          <FileText className="h-7 w-7" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Sign In to View Income Reports
        </h1>
        <p className="mt-2 text-sm text-slate-600 leading-relaxed">
          Connect your Pollar wallet to generate certified income verification reports for lenders, banks, or housing applications.
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

  const workerName =
    user?.displayName || user?.email || (user?.address ? shortAddress(user.address, 6, 6) : "Independent Worker");

  const reportDate = new Date().toLocaleDateString("en-US", {
    dateStyle: "long",
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 w-full">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-6 mb-8 print:hidden">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Income Verification Report
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Certified record of earnings backed by non-custodial Stellar on-chain settlements.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-slate-800 transition-all"
          >
            <Printer className="h-4 w-4" />
            <span>Print Report / PDF</span>
          </button>
        </div>
      </div>

      {/* Printable Report Document Card */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-10 shadow-lg print:border-none print:shadow-none print:p-0">
        {/* Document Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-6 mb-8 gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-extrabold tracking-tight text-slate-900">
                CHAMBA RECEIPTS
              </span>
              <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                OFFICIAL RECORD
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Proof of Professional Income & Payment Activity</p>
          </div>

          <div className="text-left sm:text-right text-xs text-slate-500">
            <div>Report Date: <span className="font-semibold text-slate-800">{reportDate}</span></div>
            <div>Account: <span className="font-mono text-slate-700">{shortAddress(user?.address || "", 8, 6)}</span></div>
          </div>
        </div>

        {/* Worker Summary Box */}
        <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-5 mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <span className="text-slate-500 block">Beneficiary Name</span>
              <span className="text-sm font-bold text-slate-900">{workerName}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Stellar Public Key</span>
              <span className="font-mono text-[11px] text-slate-700 select-all">{user?.address}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Settlement Rail</span>
              <span className="font-semibold text-emerald-700">Pollar Protocol (Stellar Ledger)</span>
            </div>
          </div>
        </div>

        {/* Aggregate KPI Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="rounded-2xl border border-slate-200 p-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total USDC Received
            </span>
            <div className="text-2xl font-extrabold text-slate-900 mt-1">
              ${formatAmount(stats.totalUsdc)}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 p-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Invoices Paid
            </span>
            <div className="text-2xl font-extrabold text-slate-900 mt-1">
              {stats.paymentCount}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 p-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Average Payment
            </span>
            <div className="text-2xl font-extrabold text-slate-900 mt-1">
              ${formatAmount(stats.averagePaymentUsdc)}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 p-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              This Month
            </span>
            <div className="text-2xl font-extrabold text-emerald-600 mt-1">
              ${formatAmount(stats.thisMonthUsdc)}
            </div>
          </div>
        </div>

        {/* Monthly Breakdown Table */}
        <div className="mb-8">
          <h2 className="text-base font-bold text-slate-900 mb-3">
            Monthly Earnings Breakdown
          </h2>

          {breakdown.length === 0 ? (
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-8 text-center">
              <AlertCircle className="h-6 w-6 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">
                Receive your first payment to start building your income history.
              </p>
              <Link
                href="/receive"
                className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:underline print:hidden"
              >
                <span>Create a payment request</span>
              </Link>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-5 py-3">Month</th>
                    <th className="px-5 py-3 text-center">Paid Invoices</th>
                    <th className="px-5 py-3 text-right">USDC Total</th>
                    {stats.totalXlm > 0 && <th className="px-5 py-3 text-right">XLM Total</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {breakdown.map((item) => (
                    <tr key={item.monthKey} className="hover:bg-slate-50/50">
                      <td className="px-5 py-3.5 font-semibold text-slate-900">{item.monthName}</td>
                      <td className="px-5 py-3.5 text-center">{item.count}</td>
                      <td className="px-5 py-3.5 text-right font-mono font-bold text-slate-900">
                        ${formatAmount(item.totalUsdc)}
                      </td>
                      {stats.totalXlm > 0 && (
                        <td className="px-5 py-3.5 text-right font-mono text-slate-700">
                          {formatAmount(item.totalXlm)} XLM
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Verification Guarantee Footer */}
        <div className="border-t border-slate-200 pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>
              Transactions verified cryptographic proof on the public Stellar decentralized ledger.
            </span>
          </div>
          <div className="font-mono text-[11px] text-slate-400">
            CHAMBA-AUDIT-V1
          </div>
        </div>
      </div>
    </div>
  );
}
