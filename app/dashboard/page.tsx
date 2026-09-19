"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePollarAuth } from "@/hooks/usePollarAuth";
import { useBalance } from "@/hooks/useBalance";
import { getDashboardStats, DashboardStats } from "@/lib/storage";
import { formatAmount, shortAddress } from "@/lib/stellar";
import { Mark, Corners, Eyebrow } from "@/components/blackout";
import {
  DollarSign,
  TrendingUp,
  Layers,
  ArrowUpRight,
  PlusCircle,
  FileText,
  ChevronRight,
  ShieldCheck,
  ArrowRight,
  Receipt,
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
      <div className="mx-auto flex max-w-md flex-1 flex-col items-center justify-center px-4 py-24 text-center">
        <span className="flex h-12 w-12 items-center justify-center border border-line-2 bg-surface-2">
          <Receipt className="h-5 w-5 text-teal" aria-hidden="true" />
        </span>
        <h1 className="bo-display mt-7 text-3xl text-ink">Connect your Pollar wallet</h1>
        <p className="mt-4 text-sm leading-relaxed text-ink-2">
          Sign in with Pollar to view your verified receipts, manage payment links, and
          track your growing proof of income.
        </p>
        <button
          onClick={login}
          className="bo-btn bo-btn-primary mt-8 px-6 py-3.5 text-xs uppercase tracking-[0.1em]"
        >
          <span>Sign in with Pollar</span>
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    );
  }

  const workerName =
    user?.displayName ||
    user?.email ||
    (user?.address ? shortAddress(user.address, 6, 4) : "Worker");

  const tiles = [
    {
      label: "Total verified income",
      icon: DollarSign,
      value: formatAmount(stats.totalUsdc),
      unit: "USDC",
      tone: "text-teal",
      foot:
        stats.totalXlm > 0
          ? `+ ${formatAmount(stats.totalXlm)} XLM`
          : "Immutable on-chain balance",
    },
    {
      label: "Confirmed receipts",
      icon: Layers,
      value: String(stats.paymentCount),
      unit: "TXNS",
      tone: "text-gold",
      foot: "Settled via Stellar Horizon",
    },
    {
      label: "This month",
      icon: TrendingUp,
      value: formatAmount(stats.thisMonthUsdc),
      unit: "USDC",
      tone: "text-aqua",
      foot: "Current calendar window",
    },
    {
      label: "Average ticket",
      icon: ArrowUpRight,
      value: formatAmount(stats.averagePaymentUsdc),
      unit: "USDC",
      tone: "text-ink",
      foot: "Per confirmed payment",
    },
  ];

  return (
    <div className="bo-rails mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Command bar */}
      <div className="flex flex-col gap-6 border-b border-line-2 pb-8 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          <Eyebrow live>Verifiable financial identity</Eyebrow>
          <h1 className="bo-display mt-5 truncate text-3xl text-ink sm:text-4xl">
            Good day, {workerName}.
          </h1>
          <p className="mt-3 text-sm text-ink-2">
            Every confirmed receipt adds to your financial record.
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
        </div>
      </div>

      {/* Wallet strip */}
      <div className="mt-8 grid grid-cols-1 gap-px bg-line-2 sm:grid-cols-3">
        <div className="bg-surface-1 px-5 py-4">
          <div className="bo-label-sm">Live wallet balance</div>
          <div className="bo-num mt-2 text-lg font-medium text-ink">
            {formatAmount(balance)} <span className="text-teal">{currency}</span>
          </div>
        </div>
        <div className="bg-surface-1 px-5 py-4">
          <div className="bo-label-sm">Receiving address</div>
          <div className="bo-code mt-2 truncate text-sm text-ink-2" title={user?.address}>
            {user?.address ? shortAddress(user.address, 8, 8) : "--"}
          </div>
        </div>
        <div className="bg-surface-1 px-5 py-4">
          <div className="bo-label-sm">Custody model</div>
          <div className="mt-2 flex items-center gap-2 text-sm text-teal">
            <Mark accent />
            Non-custodial direct
          </div>
        </div>
      </div>

      {/* Context panel */}
      <div className="bo-panel relative mt-8 overflow-hidden">
        <Corners />
        <div className="grid grid-cols-1 md:grid-cols-12">
          <div className="p-7 md:col-span-8">
            <span className="bo-chip bo-chip-gold">Your work is building something</span>
            <h2 className="bo-heading mt-5 text-xl font-medium text-ink sm:text-2xl">
              Small payments add up to life milestones.
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink-2">
              Every invoice settled through Pollar is permanently recorded. Use your
              exportable income statement when renting a studio, applying for business
              grants, or seeking visa sponsorship.
            </p>
          </div>
          <div className="bo-media relative h-32 md:col-span-4 md:h-full">
            <Image
              src="/images/worker-artisan-entrepreneur.jpg"
              alt="African entrepreneur managing her business"
              fill
              className="object-cover object-center"
              sizes="(max-width: 768px) 100vw, 320px"
            />
            <span className="bo-label-sm absolute bottom-3 left-4 z-10">
              Documented &amp; verifiable
            </span>
          </div>
        </div>
      </div>

      {/* Metric tiles */}
      <div className="mt-8 grid grid-cols-1 gap-px bg-line-2 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map((t) => {
          const Icon = t.icon;
          return (
            <div key={t.label} className="group bg-surface-2 p-6">
              <div className="flex items-start justify-between gap-3">
                <span className="bo-label-sm max-w-[8rem] leading-relaxed">{t.label}</span>
                <Icon className={`h-4 w-4 shrink-0 ${t.tone}`} aria-hidden="true" />
              </div>
              <div className="mt-6 flex items-baseline gap-2">
                <span className="bo-display bo-num text-3xl text-ink sm:text-4xl">
                  {t.value}
                </span>
                <span className={`bo-label-sm ${t.tone}`}>{t.unit}</span>
              </div>
              <div className="mt-4 flex items-center gap-2 border-t border-line-1 pt-3">
                <Mark />
                <span className="text-2xs text-ink-3">{t.foot}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Ledger */}
      <section className="bo-panel mt-8">
        <div className="flex items-center justify-between border-b border-line-2 px-6 py-4">
          <div className="flex items-center gap-3">
            <Mark accent />
            <h2 className="bo-label text-ink">Recent payments</h2>
          </div>
          <Link
            href="/income"
            className="group inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.1em] text-teal hover:text-ink"
          >
            <span>Full history</span>
            <ChevronRight
              className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </Link>
        </div>

        {stats.recentPayments.length === 0 ? (
          <div className="px-6 py-20 text-center">
            <span className="mx-auto flex h-12 w-12 items-center justify-center border border-line-2 bg-surface-3">
              <Receipt className="h-5 w-5 text-ink-3" aria-hidden="true" />
            </span>
            <h3 className="bo-heading mt-6 text-lg font-medium text-ink">
              Your first payment starts your story.
            </h3>
            <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-ink-3">
              Create a payment request to start receiving direct USDC or XLM payments and
              generating digital proof of income.
            </p>
            <Link
              href="/receive"
              className="bo-btn bo-btn-primary mt-8 px-5 py-3 text-xs uppercase tracking-[0.1em]"
            >
              <PlusCircle className="h-4 w-4" aria-hidden="true" />
              <span>Create payment request</span>
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-line-1">
            {stats.recentPayments.map((p) => {
              const formattedDate = new Date(p.paidAt || p.createdAt).toLocaleDateString(
                "en-US",
                { month: "short", day: "numeric", year: "numeric" }
              );
              return (
                <li
                  key={p.id}
                  className="bo-hover-row flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-start gap-4">
                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center border border-teal/30 bg-teal/8">
                      <ShieldCheck className="h-4 w-4 text-teal" aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-ink">
                        {p.description}
                      </div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span className="text-2xs text-ink-2">
                          {p.payerName || "Customer"}
                        </span>
                        <span className="bo-num text-2xs text-ink-3">{formattedDate}</span>
                        <span className="bo-code text-2xs text-ink-3">{p.id}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-5 sm:justify-end">
                    <div className="text-right">
                      <div className="bo-num text-base font-medium text-ink">
                        +{formatAmount(p.amount)}{" "}
                        <span className="text-teal">{p.currency}</span>
                      </div>
                      <span className="bo-chip bo-chip-ok mt-1.5">Paid</span>
                    </div>

                    <div className="flex items-center gap-px bg-line-2">
                      <Link
                        href={`/receipt/${p.id}`}
                        className="bo-btn bo-btn-secondary h-9 w-9"
                        title="View official receipt"
                      >
                        <FileText className="h-4 w-4" aria-hidden="true" />
                        <span className="sr-only">Receipt {p.id}</span>
                      </Link>
                      <Link
                        href={`/transaction/${p.id}`}
                        className="bo-btn bo-btn-secondary h-9 w-9"
                        title="Stellar Horizon details"
                      >
                        <ChevronRight className="h-4 w-4" aria-hidden="true" />
                        <span className="sr-only">Ledger detail {p.id}</span>
                      </Link>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
