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
import { Mark, Corners, Eyebrow } from "@/components/blackout";
import { ChambaMark } from "@/components/ChambaMark";
import {
  FileText,
  Printer,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
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
      <div className="mx-auto flex max-w-md flex-1 flex-col items-center justify-center px-4 py-24 text-center">
        <span className="flex h-12 w-12 items-center justify-center border border-line-2 bg-surface-2">
          <FileText className="h-5 w-5 text-teal" aria-hidden="true" />
        </span>
        <h1 className="bo-display mt-7 text-3xl text-ink">Sign in to view income reports</h1>
        <p className="mt-4 text-sm leading-relaxed text-ink-2">
          Connect your Pollar wallet to generate certified income verification reports for
          lenders, banks, or housing applications.
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

  const workerName =
    user?.displayName ||
    user?.email ||
    (user?.address ? shortAddress(user.address, 6, 6) : "Independent Worker");

  const reportDate = new Date().toLocaleDateString("en-US", { dateStyle: "long" });

  const kpis = [
    { label: "Total USDC received", value: `$${formatAmount(stats.totalUsdc)}`, tone: "text-teal" },
    { label: "Total invoices paid", value: String(stats.paymentCount), tone: "text-ink" },
    { label: "Average payment", value: `$${formatAmount(stats.averagePaymentUsdc)}`, tone: "text-ink" },
    { label: "This month", value: `$${formatAmount(stats.thisMonthUsdc)}`, tone: "text-aqua" },
  ];

  return (
    <div className="bo-rails mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Control bar -- screen only */}
      <div className="flex flex-col gap-6 border-b border-line-2 pb-8 sm:flex-row sm:items-end sm:justify-between print:hidden">
        <div>
          <Eyebrow>Official financial statement</Eyebrow>
          <h1 className="bo-display mt-5 text-3xl text-ink sm:text-4xl">
            Your progress, in numbers.
          </h1>
          <p className="mt-3 max-w-lg text-sm text-ink-2">
            A certified record of earnings backed by non-custodial Stellar settlements.
          </p>
        </div>

        <button
          onClick={handlePrint}
          className="bo-btn bo-btn-primary shrink-0 px-5 py-3 text-xs uppercase tracking-[0.1em]"
        >
          <Printer className="h-4 w-4" aria-hidden="true" />
          <span>Print statement</span>
        </button>
      </div>

      <p className="mt-6 flex items-start gap-3 text-2xs leading-relaxed text-ink-3 print:hidden">
        <Mark />
        <span>
          Printing renders this statement as a clean black-on-white document. The dark
          interface is dropped entirely so the page reads as official paper.
        </span>
      </p>

      {/* The document */}
      <article className="bo-panel bo-print-doc relative mt-6 p-6 sm:p-10 print:mt-0 print:p-0">
        <Corners />

        {/* Masthead */}
        <header className="flex flex-col gap-5 border-b border-line-2 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3.5">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center border border-line-2 bg-surface-3">
              <ChambaMark className="h-6 w-6 text-teal bo-print-accent" />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="bo-heading text-base font-semibold uppercase tracking-[0.18em] text-ink">
                  Chamba Receipts
                </span>
                <span className="bo-chip bo-chip-ok bo-print-accent">Official record</span>
              </div>
              <p className="bo-label-sm mt-2">
                Proof of professional income &amp; payment activity
              </p>
            </div>
          </div>

          <dl className="space-y-1.5 text-left sm:text-right">
            <div>
              <dt className="bo-label-sm inline">Certified&nbsp;</dt>
              <dd className="bo-num inline text-xs font-medium text-ink">{reportDate}</dd>
            </div>
            <div>
              <dt className="bo-label-sm inline">Account&nbsp;</dt>
              <dd className="bo-code inline text-xs text-teal bo-print-accent">
                {shortAddress(user?.address || "", 8, 6)}
              </dd>
            </div>
          </dl>
        </header>

        {/* Beneficiary block */}
        <div className="bo-panel-inset mt-8 grid grid-cols-1 gap-6 p-5 sm:grid-cols-3">
          <div>
            <div className="bo-label-sm">Beneficiary name</div>
            <div className="mt-2 text-sm font-medium text-ink">{workerName}</div>
          </div>
          <div className="min-w-0">
            <div className="bo-label-sm">Stellar public key</div>
            <div className="bo-code mt-2 select-all break-all text-2xs text-ink-2">
              {user?.address}
            </div>
          </div>
          <div>
            <div className="bo-label-sm">Settlement rail</div>
            <div className="mt-2 flex items-center gap-2 text-sm text-teal bo-print-accent">
              <Mark accent />
              Pollar &middot; Stellar ledger
            </div>
          </div>
        </div>

        {/* KPI band */}
        <div className="mt-8 grid grid-cols-2 gap-px bg-line-2 sm:grid-cols-4 print:gap-4 print:bg-transparent">
          {kpis.map((k) => (
            <div key={k.label} className="bg-surface-2 p-5 print:border print:p-4">
              <div className="bo-label-sm leading-relaxed">{k.label}</div>
              <div className={`bo-display bo-num mt-4 text-2xl ${k.tone}`}>{k.value}</div>
            </div>
          ))}
        </div>

        {/* Monthly breakdown */}
        <section className="mt-10">
          <div className="flex items-center gap-3">
            <Mark accent />
            <h2 className="bo-label text-ink">Monthly earnings breakdown</h2>
            <span className="h-px flex-1 bg-line-1" aria-hidden="true" />
          </div>

          {breakdown.length === 0 ? (
            <div className="bo-panel-inset mt-5 p-8 text-center">
              <AlertCircle className="mx-auto h-5 w-5 text-ink-3" aria-hidden="true" />
              <p className="bo-heading mt-4 text-sm font-medium text-ink">
                Receive your first payment to start building your verified income history.
              </p>
              <Link
                href="/receive"
                className="mt-4 inline-block text-xs font-medium uppercase tracking-[0.1em] text-teal hover:underline print:hidden"
              >
                Create a payment request
              </Link>
            </div>
          ) : (
            <div className="mt-5 border border-line-2 print:border-0">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-line-2 bg-surface-1 print:bg-transparent">
                  <tr>
                    <th scope="col" className="bo-label-sm px-5 py-3.5">
                      Month
                    </th>
                    <th scope="col" className="bo-label-sm px-5 py-3.5 text-center">
                      Invoices
                    </th>
                    <th scope="col" className="bo-label-sm px-5 py-3.5 text-right">
                      USDC total
                    </th>
                    {stats.totalXlm > 0 && (
                      <th scope="col" className="bo-label-sm px-5 py-3.5 text-right">
                        XLM total
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-line-1">
                  {breakdown.map((item) => (
                    <tr key={item.monthKey} className="bo-hover-row">
                      <td className="px-5 py-3.5 font-medium text-ink">{item.monthName}</td>
                      <td className="bo-num px-5 py-3.5 text-center text-ink-2">
                        {item.count}
                      </td>
                      <td className="bo-num px-5 py-3.5 text-right font-medium text-ink">
                        ${formatAmount(item.totalUsdc)}
                      </td>
                      {stats.totalXlm > 0 && (
                        <td className="bo-num px-5 py-3.5 text-right text-ink-2">
                          {formatAmount(item.totalXlm)}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Attestation */}
        <footer className="mt-10 flex flex-col gap-4 border-t border-line-2 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <ShieldCheck
              className="mt-0.5 h-4 w-4 shrink-0 text-teal bo-print-accent"
              aria-hidden="true"
            />
            <span className="text-2xs leading-relaxed text-ink-2">
              Transactions carry cryptographic proof on the public Stellar decentralised
              ledger and can be independently verified by any third party.
            </span>
          </div>
          <span className="bo-code bo-label-sm shrink-0">CHAMBA-AUDIT-V1</span>
        </footer>
      </article>
    </div>
  );
}
