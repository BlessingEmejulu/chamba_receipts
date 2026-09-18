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
  ShieldCheck,
  AlertCircle,
  Sparkles,
  Receipt,
  BadgeCheck,
  CheckCircle2,
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
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#075E54]/10 text-[#075E54] mb-6">
          <FileText className="h-8 w-8 text-[#075E54]" />
        </div>
        <h1 className="font-heading text-3xl font-black tracking-tight text-[#102A2A]">
          Sign In to View Income Reports
        </h1>
        <p className="mt-3 text-sm text-[#5F6F6D] leading-relaxed">
          Connect your Pollar wallet to generate certified income verification reports for lenders, banks, or housing applications.
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

  const workerName =
    user?.displayName || user?.email || (user?.address ? shortAddress(user.address, 6, 6) : "Independent Worker");

  const reportDate = new Date().toLocaleDateString("en-US", {
    dateStyle: "long",
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 w-full">
      {/* Header Bar (Hidden in Print) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#075E54]/10 pb-6 mb-8 print:hidden">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-bold text-[#075E54] uppercase tracking-wider mb-1.5">
            <span className="h-2 w-2 rounded-full bg-[#16A085]" />
            Official Financial Statement
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl font-black tracking-tight text-[#102A2A]">
            Your progress, in numbers.
          </h1>
          <p className="text-sm text-[#5F6F6D] mt-1">
            Small payments. Real progress. Certified record of earnings backed by non-custodial Stellar on-chain settlements.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 rounded-xl bg-[#075E54] px-5 py-3 text-sm font-bold text-white shadow-md shadow-[#075E54]/20 hover:bg-[#064e46] transition-all cursor-pointer"
          >
            <Printer className="h-4 w-4" />
            <span>Print Official Statement</span>
          </button>
        </div>
      </div>

      {/* Printable Report Document Card */}
      <div className="rounded-3xl border border-[#075E54]/20 bg-white p-6 sm:p-10 shadow-lg print:border-none print:shadow-none print:p-0">
        {/* Document Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-6 mb-8 gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#075E54] text-white shadow-sm">
              <Receipt className="h-6 w-6 text-[#F2A900]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-heading text-lg font-black tracking-tight text-[#102A2A]">
                  CHAMBA RECEIPTS
                </span>
                <span className="rounded-full bg-[#16A085]/15 px-2.5 py-0.5 text-2xs font-bold text-[#075E54] border border-[#16A085]/30">
                  OFFICIAL RECORD
                </span>
              </div>
              <p className="text-xs text-[#5F6F6D] font-medium mt-0.5">
                Proof of Professional Income & Payment Activity
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right text-xs text-[#5F6F6D]">
            <div>Report Certified: <span className="font-bold text-[#102A2A]">{reportDate}</span></div>
            <div>Account: <span className="font-mono text-[#075E54] font-semibold">{shortAddress(user?.address || "", 8, 6)}</span></div>
          </div>
        </div>

        {/* Worker Summary Box */}
        <div className="rounded-2xl border border-[#075E54]/15 bg-[#F8F7F2] p-5 mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <span className="text-[#5F6F6D] block font-medium">Beneficiary Name</span>
              <span className="font-heading text-sm font-bold text-[#102A2A]">{workerName}</span>
            </div>
            <div>
              <span className="text-[#5F6F6D] block font-medium">Stellar Public Key</span>
              <span className="font-mono text-2xs text-[#102A2A] select-all break-all">{user?.address}</span>
            </div>
            <div>
              <span className="text-[#5F6F6D] block font-medium">Settlement Rail</span>
              <span className="font-bold text-[#075E54] flex items-center gap-1 mt-0.5">
                <BadgeCheck className="h-3.5 w-3.5 text-[#16A085]" />
                Pollar &bull; Stellar Ledger
              </span>
            </div>
          </div>
        </div>

        {/* Aggregate KPI Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="rounded-2xl border border-[#075E54]/15 p-4 bg-white shadow-2xs">
            <span className="text-2xs font-bold uppercase tracking-wider text-[#5F6F6D]">
              Total USDC Received
            </span>
            <div className="font-heading text-2xl font-black text-[#102A2A] mt-1.5">
              ${formatAmount(stats.totalUsdc)}
            </div>
          </div>

          <div className="rounded-2xl border border-[#075E54]/15 p-4 bg-white shadow-2xs">
            <span className="text-2xs font-bold uppercase tracking-wider text-[#5F6F6D]">
              Total Invoices Paid
            </span>
            <div className="font-heading text-2xl font-black text-[#102A2A] mt-1.5">
              {stats.paymentCount}
            </div>
          </div>

          <div className="rounded-2xl border border-[#075E54]/15 p-4 bg-white shadow-2xs">
            <span className="text-2xs font-bold uppercase tracking-wider text-[#5F6F6D]">
              Average Payment
            </span>
            <div className="font-heading text-2xl font-black text-[#102A2A] mt-1.5">
              ${formatAmount(stats.averagePaymentUsdc)}
            </div>
          </div>

          <div className="rounded-2xl border border-[#075E54]/15 p-4 bg-white shadow-2xs">
            <span className="text-2xs font-bold uppercase tracking-wider text-[#5F6F6D]">
              This Month
            </span>
            <div className="font-heading text-2xl font-black text-[#075E54] mt-1.5">
              ${formatAmount(stats.thisMonthUsdc)}
            </div>
          </div>
        </div>

        {/* Monthly Breakdown Table */}
        <div className="mb-8">
          <h2 className="font-heading text-base font-bold text-[#102A2A] mb-3">
            Monthly Earnings Breakdown
          </h2>

          {breakdown.length === 0 ? (
            <div className="rounded-2xl border border-[#075E54]/15 bg-[#F8F7F2] p-8 text-center">
              <AlertCircle className="h-6 w-6 text-[#5F6F6D] mx-auto mb-2" />
              <p className="font-heading text-sm font-bold text-[#102A2A]">
                Receive your first payment to start building your verified income history.
              </p>
              <Link
                href="/receive"
                className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-[#075E54] hover:underline print:hidden"
              >
                <span>Create a payment request</span>
              </Link>
            </div>
          ) : (
            <div className="rounded-2xl border border-[#075E54]/15 overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-[#075E54]/10 bg-[#F8F7F2] text-xs font-bold uppercase tracking-wider text-[#5F6F6D]">
                  <tr>
                    <th className="px-5 py-3">Month</th>
                    <th className="px-5 py-3 text-center">Paid Invoices</th>
                    <th className="px-5 py-3 text-right">USDC Total</th>
                    {stats.totalXlm > 0 && <th className="px-5 py-3 text-right">XLM Total</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {breakdown.map((item) => (
                    <tr key={item.monthKey} className="hover:bg-[#F8F7F2]/50">
                      <td className="px-5 py-3.5 font-bold text-[#102A2A]">{item.monthName}</td>
                      <td className="px-5 py-3.5 text-center font-medium">{item.count}</td>
                      <td className="px-5 py-3.5 text-right font-mono font-bold text-[#102A2A]">
                        ${formatAmount(item.totalUsdc)}
                      </td>
                      {stats.totalXlm > 0 && (
                        <td className="px-5 py-3.5 text-right font-mono text-[#5F6F6D]">
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
        <div className="border-t border-[#075E54]/15 pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-[#5F6F6D]">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-[#16A085] shrink-0" />
            <span>
              Transactions verified cryptographic proof on the public Stellar decentralized ledger.
            </span>
          </div>
          <div className="font-mono text-2xs text-[#5F6F6D]">
            CHAMBA-AUDIT-V1
          </div>
        </div>
      </div>
    </div>
  );
}
