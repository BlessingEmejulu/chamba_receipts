"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePollarAuth } from "@/hooks/usePollarAuth";
import { useBalance } from "@/hooks/useBalance";
import {
  getDashboardStats,
  DashboardStats,
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
  ChevronRight,
  ShieldCheck,
  AlertCircle,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Receipt,
  HeartHandshake,
} from "lucide-react";

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading, login } = usePollarAuth();
  const { balance, currency } = useBalance();
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
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#075E54]/10 text-[#075E54] mb-6 shadow-sm">
          <Receipt className="h-8 w-8 text-[#075E54]" />
        </div>
        <h1 className="font-heading text-3xl font-black tracking-tight text-[#102A2A]">
          Connect your Pollar Wallet
        </h1>
        <p className="mt-3 text-sm text-[#5F6F6D] leading-relaxed max-w-sm">
          Sign in with Pollar to view your verified receipts, manage payment links, and track your growing proof of income.
        </p>
        <button
          onClick={login}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#075E54] px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#075E54]/20 hover:bg-[#064e46] active:scale-[0.98] transition-all cursor-pointer"
        >
          <Sparkles className="h-4 w-4 text-[#F2A900]" />
          <span>Sign In with Pollar</span>
        </button>
      </div>
    );
  }

  const workerName = user?.displayName || user?.email || (user?.address ? shortAddress(user.address, 6, 4) : "Worker");

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 w-full">
      {/* Welcome Bar with Human Warmth */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 border-b border-[#075E54]/10 pb-8 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-bold text-[#075E54] uppercase tracking-wider mb-2">
            <span className="h-2 w-2 rounded-full bg-[#16A085]" />
            Verifiable Financial Identity
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-[#102A2A]">
            Good day, {workerName}.
          </h1>
          <p className="text-sm text-[#5F6F6D] mt-1.5 font-normal">
            Here is how your work is doing. Every confirmed receipt adds to your financial dignity.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/receive"
            className="inline-flex items-center gap-2 rounded-xl bg-[#075E54] px-5 py-3 text-sm font-bold text-white shadow-md shadow-[#075E54]/20 hover:bg-[#064e46] active:scale-[0.98] transition-all"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Create Payment Request</span>
          </Link>
          <Link
            href="/report"
            className="inline-flex items-center gap-2 rounded-xl border border-[#075E54]/20 bg-white px-5 py-3 text-sm font-semibold text-[#102A2A] hover:bg-[#F8F7F2] transition-all shadow-2xs"
          >
            <FileText className="h-4 w-4 text-[#075E54]" />
            <span>Income Statement</span>
          </Link>
        </div>
      </div>

      {/* Motivational Progress Banner */}
      <div className="mb-8 rounded-3xl border border-[#075E54]/15 bg-white p-6 sm:p-8 shadow-sm overflow-hidden relative">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          <div className="md:col-span-8">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-[#F2A900]/15 px-3 py-1 text-2xs font-bold text-[#b37d00] uppercase tracking-wide mb-2">
              <Sparkles className="h-3 w-3" />
              Your Work is Building Something
            </div>
            <h2 className="font-heading text-xl sm:text-2xl font-black text-[#102A2A]">
              Small payments add up to life milestones.
            </h2>
            <p className="text-xs sm:text-sm text-[#5F6F6D] mt-2 leading-relaxed">
              Every invoice settled through Pollar is permanently recorded. Use your exportable Income Statement when renting a studio, applying for business grants, or seeking visa sponsorship.
            </p>
          </div>
          <div className="md:col-span-4 relative h-28 sm:h-32 rounded-2xl overflow-hidden shadow-inner border border-slate-100">
            <Image
              src="/images/worker-artisan-entrepreneur.jpg"
              alt="African entrepreneur managing business"
              fill
              className="object-cover object-center"
              sizes="(max-width: 768px) 100vw, 300px"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#102A2A]/70 via-transparent to-transparent flex items-end p-2.5">
              <span className="text-2xs font-semibold text-white">Documented & Verifiable</span>
            </div>
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
        {/* Card 1: Total Received */}
        <div className="rounded-3xl border border-[#075E54]/15 bg-white p-6 shadow-2xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#5F6F6D]">
              Total Verified Income
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#075E54]/10 text-[#075E54]">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-1.5">
            <span className="font-heading text-3xl sm:text-4xl font-black text-[#102A2A]">
              {formatAmount(stats.totalUsdc)}
            </span>
            <span className="text-sm font-bold text-[#075E54]">USDC</span>
          </div>
          {stats.totalXlm > 0 ? (
            <div className="text-xs text-[#5F6F6D] mt-1.5 font-medium">
              + {formatAmount(stats.totalXlm)} XLM
            </div>
          ) : (
            <div className="text-2xs text-[#5F6F6D] mt-1.5 flex items-center gap-1 font-medium">
              <CheckCircle2 className="h-3 w-3 text-[#16A085]" />
              Immutable on-chain balance
            </div>
          )}
        </div>

        {/* Card 2: Payments Count */}
        <div className="rounded-3xl border border-[#075E54]/15 bg-white p-6 shadow-2xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#5F6F6D]">
              Confirmed Receipts
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F2A900]/15 text-[#b37d00]">
              <Layers className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-1.5">
            <span className="font-heading text-3xl sm:text-4xl font-black text-[#102A2A]">
              {stats.paymentCount}
            </span>
            <span className="text-xs font-semibold text-[#5F6F6D]">transactions</span>
          </div>
          <div className="text-2xs text-[#5F6F6D] mt-1.5 flex items-center gap-1 font-medium">
            <ShieldCheck className="h-3 w-3 text-[#075E54]" />
            Settled via Stellar Horizon
          </div>
        </div>

        {/* Card 3: This Month */}
        <div className="rounded-3xl border border-[#075E54]/15 bg-white p-6 shadow-2xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#5F6F6D]">
              This Month
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#16A085]/15 text-[#16A085]">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-1.5">
            <span className="font-heading text-3xl sm:text-4xl font-black text-[#102A2A]">
              {formatAmount(stats.thisMonthUsdc)}
            </span>
            <span className="text-sm font-bold text-[#16A085]">USDC</span>
          </div>
          <div className="text-2xs text-[#5F6F6D] mt-1.5 font-medium">
            Current calendar window
          </div>
        </div>

        {/* Card 4: Average Payment */}
        <div className="rounded-3xl border border-[#075E54]/15 bg-white p-6 shadow-2xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#5F6F6D]">
              Average Ticket
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#075E54]/10 text-[#075E54]">
              <ArrowUpRight className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-1.5">
            <span className="font-heading text-3xl sm:text-4xl font-black text-[#102A2A]">
              {formatAmount(stats.averagePaymentUsdc)}
            </span>
            <span className="text-sm font-bold text-[#075E54]">USDC</span>
          </div>
          <div className="text-2xs text-[#5F6F6D] mt-1.5 font-medium">
            Per confirmed payment
          </div>
        </div>
      </div>

      {/* Recent Payments Section */}
      <div className="rounded-3xl border border-[#075E54]/15 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between border-b border-[#075E54]/10 px-6 sm:px-8 py-5">
          <div className="flex items-center gap-2.5">
            <Clock className="h-5 w-5 text-[#075E54]" />
            <h2 className="font-heading text-lg font-bold text-[#102A2A]">Recent Payments</h2>
          </div>
          <Link
            href="/income"
            className="text-xs font-bold text-[#075E54] hover:text-[#064e46] flex items-center gap-1 group"
          >
            <span>View Full Income Story</span>
            <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {stats.recentPayments.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#075E54]/10 text-[#075E54] mb-4">
              <Sparkles className="h-7 w-7 text-[#F2A900]" />
            </div>
            <h3 className="font-heading text-lg font-bold text-[#102A2A]">
              Your first payment starts your story.
            </h3>
            <p className="text-xs sm:text-sm text-[#5F6F6D] mt-2 max-w-md mx-auto leading-relaxed">
              Create a payment request to start receiving direct USDC/XLM payments and generating digital proof of income.
            </p>
            <div className="mt-6">
              <Link
                href="/receive"
                className="inline-flex items-center gap-2 rounded-xl bg-[#075E54] px-5 py-3 text-xs sm:text-sm font-bold text-white shadow-md shadow-[#075E54]/20 hover:bg-[#064e46] transition-all"
              >
                <PlusCircle className="h-4 w-4" />
                <span>Create Payment Request</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-[#075E54]/10">
            {stats.recentPayments.map((p) => {
              const formattedDate = new Date(p.paidAt || p.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              });
              return (
                <div
                  key={p.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between px-6 sm:px-8 py-4 sm:py-5 hover:bg-[#F8F7F2]/50 transition-colors gap-4"
                >
                  <div className="flex items-start sm:items-center gap-3.5">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#16A085]/10 text-[#075E54]">
                      <ShieldCheck className="h-6 w-6 text-[#16A085]" />
                    </div>
                    <div>
                      <div className="font-heading font-bold text-[#102A2A] text-sm sm:text-base">
                        {p.description}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-[#5F6F6D] mt-0.5">
                        <span className="font-semibold text-[#102A2A]">{p.payerName || "Customer"}</span>
                        <span>&bull;</span>
                        <span>{formattedDate}</span>
                        <span>&bull;</span>
                        <span className="font-mono text-2xs bg-slate-100 px-1.5 py-0.5 rounded text-[#5F6F6D]">
                          {p.id}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-5">
                    <div className="text-right">
                      <div className="font-heading text-base sm:text-lg font-black text-[#102A2A]">
                        +{formatAmount(p.amount)} {p.currency}
                      </div>
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#16A085]/15 px-2.5 py-0.5 text-2xs font-bold text-[#075E54] border border-[#16A085]/30">
                        <CheckCircle2 className="h-3 w-3 text-[#16A085]" />
                        PAID
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/receipt/${p.id}`}
                        className="rounded-xl border border-[#075E54]/20 bg-white p-2.5 text-[#075E54] hover:bg-[#075E54] hover:text-white transition-all shadow-2xs"
                        title="View Official Receipt"
                      >
                        <FileText className="h-4 w-4" />
                      </Link>
                      <Link
                        href={`/transaction/${p.id}`}
                        className="rounded-xl border border-[#075E54]/20 bg-white p-2.5 text-[#5F6F6D] hover:bg-slate-100 hover:text-[#102A2A] transition-all shadow-2xs"
                        title="Stellar Horizon Details"
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
