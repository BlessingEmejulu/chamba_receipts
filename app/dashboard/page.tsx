"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePollarAuth } from "@/hooks/usePollarAuth";
import { useBalance } from "@/hooks/useBalance";
import {
  getDashboardStats,
  DashboardStats,
  listPaymentRecords,
} from "@/lib/storage";
import { formatAmount, shortAddress } from "@/lib/stellar";
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  Layers,
  ArrowUpRight,
  PlusCircle,
  FileText,
  Clock,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading, login } = usePollarAuth();
  const { balance, currency, refresh: refreshBalance } = useBalance();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsdc: 0,
    totalXlm: 0,
    paymentCount: 0,
    thisMonthUsdc: 0,
    thisMonthXlm: 0,
    averagePaymentUsdc: 0,
    recentPayments: [],
  });

  const loadStats = () => {
    const s = getDashboardStats(user?.address);
    setStats(s);
  };

  useEffect(() => {
    loadStats();
    if (typeof window !== "undefined") {
      window.addEventListener("storage_chamba_updated", loadStats);
      return () => window.removeEventListener("storage_chamba_updated", loadStats);
    }
  }, [user?.address]);

  if (!isAuthenticated && !isLoading) {
    return (
      <div className="mx-auto flex max-w-lg flex-1 flex-col items-center justify-center px-4 py-20 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 mb-6">
          <CreditCard className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Connect your Pollar Wallet
        </h1>
        <p className="mt-2 text-sm text-slate-600 leading-relaxed max-w-sm">
          Sign in with Pollar to view your confirmed income receipts, manage payment requests, and track your business earnings.
        </p>
        <button
          onClick={login}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 active:scale-[0.98] transition-all"
        >
          <span>Sign In with Pollar</span>
        </button>
      </div>
    );
  }

  const workerName = user?.displayName || user?.email || (user?.address ? shortAddress(user.address, 6, 4) : "Worker");

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 w-full">
      {/* Welcome Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-6 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Welcome back, {workerName}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Track your verified payments, generate receipts, and inspect income records.
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
            <span>Income Report</span>
          </Link>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Card 1: Total Received */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Received
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-3xl font-extrabold text-slate-900">
              {formatAmount(stats.totalUsdc)}
            </span>
            <span className="text-sm font-bold text-emerald-600">USDC</span>
          </div>
          {stats.totalXlm > 0 && (
            <div className="text-xs text-slate-500 mt-1">
              + {formatAmount(stats.totalXlm)} XLM
            </div>
          )}
        </div>

        {/* Card 2: Payment Count */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Payments Count
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <Layers className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-3xl font-extrabold text-slate-900">
              {stats.paymentCount}
            </span>
            <span className="text-xs font-medium text-slate-500">receipts</span>
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Confirmed Stellar transactions
          </div>
        </div>

        {/* Card 3: This Month */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              This Month
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-3xl font-extrabold text-slate-900">
              {formatAmount(stats.thisMonthUsdc)}
            </span>
            <span className="text-sm font-bold text-purple-600">USDC</span>
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Current calendar month
          </div>
        </div>

        {/* Card 4: Average Payment */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Average Payment
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <ArrowUpRight className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-3xl font-extrabold text-slate-900">
              {formatAmount(stats.averagePaymentUsdc)}
            </span>
            <span className="text-sm font-bold text-amber-600">USDC</span>
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Per confirmed payment
          </div>
        </div>
      </div>

      {/* Recent Payments Section */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-slate-500" />
            <h2 className="text-base font-bold text-slate-900">Recent Payments</h2>
          </div>
          <Link
            href="/income"
            className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
          >
            <span>View All History</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {stats.recentPayments.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-3">
              <AlertCircle className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900">
              You haven't received any payments yet.
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Create a payment request to start receiving real USDC/XLM payments and generating digital proof of income.
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
            {stats.recentPayments.map((p) => {
              const formattedDate = new Date(p.paidAt || p.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              });
              return (
                <div
                  key={p.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4 hover:bg-slate-50/70 transition-colors gap-3"
                >
                  <div className="flex items-start sm:items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                      <ShieldCheck className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900 text-sm">
                        {p.description}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                        <span>{p.payerName || "Customer"}</span>
                        <span>•</span>
                        <span>{formattedDate}</span>
                        <span>•</span>
                        <span className="font-mono">{p.id}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4">
                    <div className="text-right">
                      <div className="text-base font-bold text-slate-900">
                        +{formatAmount(p.amount)} {p.currency}
                      </div>
                      <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200/60">
                        PAID
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/receipt/${p.id}`}
                        className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                        title="View Receipt"
                      >
                        <FileText className="h-4 w-4" />
                      </Link>
                      <Link
                        href={`/transaction/${p.id}`}
                        className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                        title="Transaction Detail"
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
