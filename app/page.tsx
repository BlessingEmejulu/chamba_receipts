"use client";

import Link from "next/link";
import { usePollarAuth } from "@/hooks/usePollarAuth";
import { ReceiptCard } from "@/components/ReceiptCard";
import { PaymentRecord } from "@/lib/storage";
import {
  ArrowRight,
  ShieldCheck,
  Zap,
  TrendingUp,
  FileCheck,
  CheckCircle2,
  Users,
  Briefcase,
  Sparkles,
} from "lucide-react";

export default function Home() {
  const { isAuthenticated, login } = usePollarAuth();

  // Example demo receipt matching prompt's demo scenario
  const exampleReceipt: PaymentRecord = {
    id: "CR-78E29A",
    paymentRequestId: "REQ-9011F4",
    transactionId: "3a89e4726bf9412cf847d0c3e9a117bfa0041235948b8c199589d9701a5e4210",
    workerAddress: "GD5J4Y4TXR3S4B7L6M7V8K2P9Q0W1E3R4T5Y6U7I8O9P0A1S2D3F4G5H",
    workerName: "Blessing Emejulu",
    payerAddress: "GC1A2B3C4D5E6F7G8H9I0J1K2L3M4N5O6P7Q8R9S0T1U2V3W4X5Y6Z7A",
    payerName: "Acme Web Studio",
    description: "Website Development",
    amount: "50.00",
    currency: "USDC",
    status: "successful",
    memo: "CR-78E29A",
    createdAt: new Date().toISOString(),
    paidAt: new Date().toISOString(),
  };

  const personas = [
    { role: "Freelancers & Devs", icon: "💻", desc: "Show client invoices, proof of project deliverables, and audited earnings." },
    { role: "Artisans & Creators", icon: "🎨", desc: "Produce real digital receipts for custom commissions and handmade goods." },
    { role: "Salons & Barbers", icon: "✂️", desc: "Instant mobile payment links that customers can scan right in the chair." },
    { role: "Consultants & Tutors", icon: "📚", desc: "Formalize lesson and session fees into documented monthly income." },
  ];

  return (
    <div className="flex flex-col gap-16 pb-20 overflow-hidden">
      {/* Hero Section */}
      <section className="relative px-4 pt-12 sm:pt-20 lg:pt-24 max-w-7xl mx-auto w-full text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200/80 bg-emerald-50/90 px-3.5 py-1 text-xs font-semibold text-emerald-800 shadow-2xs mb-6 animate-pulse">
          <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
          <span>Built on Pollar & Stellar Blockchain</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 max-w-4xl mx-auto leading-[1.12]">
          Turn every payment into{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">
            proof of income.
          </span>
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
          A non-custodial payment and income-record application for freelancers, creators, artisans, and small service providers. Users create payment requests, receive real payments through Pollar, automatically generate digital receipts, and maintain a verifiable income history.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
          {isAuthenticated ? (
            <Link
              href="/receive"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3.5 text-base font-semibold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700 active:scale-[0.98] transition-all"
            >
              <span>Receive Payment</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          ) : (
            <button
              onClick={login}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3.5 text-base font-semibold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700 active:scale-[0.98] transition-all"
            >
              <span>Start Receiving Payments</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          )}

          <a
            href="#how-it-works"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3.5 text-base font-semibold text-slate-700 hover:bg-slate-50 transition-all shadow-2xs"
          >
            <span>See How It Works</span>
          </a>
        </div>

        {/* Live Badge metrics */}
        <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto border-y border-slate-200/80 py-6 text-center">
          <div>
            <div className="text-2xl font-bold text-slate-900">100%</div>
            <div className="text-xs text-slate-500 font-medium mt-0.5">Non-Custodial</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-emerald-600">Zero XLM</div>
            <div className="text-xs text-slate-500 font-medium mt-0.5">Fees Sponsored</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">&lt; 5 sec</div>
            <div className="text-xs text-slate-500 font-medium mt-0.5">Stellar Settlement</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">USDC & XLM</div>
            <div className="text-xs text-slate-500 font-medium mt-0.5">Assets Supported</div>
          </div>
        </div>
      </section>

      {/* Example Receipt Section */}
      <section className="px-4 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
            Real Proof of Income
          </span>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 mt-1">
            Example Digital Receipt
          </h2>
          <p className="text-slate-600 text-sm mt-2">
            Every payment confirmed through Pollar produces an unalterable receipt with block explorer verification.
          </p>
        </div>

        <ReceiptCard record={exampleReceipt} showActions={true} />
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="px-4 py-12 max-w-7xl mx-auto w-full border-t border-slate-200/80">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
            Step by step flow
          </span>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 mt-1">
            How Chamba Receipts Works
          </h2>
          <p className="text-slate-600 text-sm mt-2">
            Seamless payment collection without messy crypto friction.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 font-bold text-lg mb-4">
              1
            </div>
            <h3 className="text-base font-bold text-slate-900">Create Request</h3>
            <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">
              Enter the amount, currency (USDC/XLM), client name, and project description.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 font-bold text-lg mb-4">
              2
            </div>
            <h3 className="text-base font-bold text-slate-900">Share Payment Link</h3>
            <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">
              Send the customer a clean mobile checkout page via WhatsApp, SMS, or QR code.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 font-bold text-lg mb-4">
              3
            </div>
            <h3 className="text-base font-bold text-slate-900">Pay with Pollar</h3>
            <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">
              Customer pays directly through their non-custodial Pollar wallet in one click.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 font-bold text-lg mb-4">
              4
            </div>
            <h3 className="text-base font-bold text-slate-900">Receipt & Proof</h3>
            <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">
              Horizon confirms the payment. An immutable receipt is issued and recorded into income reports.
            </p>
          </div>
        </div>
      </section>

      {/* Built For Independent Workers */}
      <section className="px-4 max-w-7xl mx-auto w-full">
        <div className="rounded-3xl bg-slate-900 text-white p-8 sm:p-12 lg:p-16">
          <div className="max-w-2xl">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              The Informal Economy
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mt-2">
              Built for Independent Workers & Creators
            </h2>
            <p className="text-slate-300 text-base mt-3 leading-relaxed">
              Millions of freelancers and service providers get paid every day but lack formal bank proof of earnings when applying for apartments, loans, visas, or gear leases. Chamba Receipts turns real payments into documented track records.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-10">
            {personas.map((p) => (
              <div key={p.role} className="rounded-2xl bg-slate-800/80 border border-slate-700/60 p-5">
                <div className="text-2xl mb-2">{p.icon}</div>
                <h3 className="font-bold text-white text-base">{p.role}</h3>
                <p className="text-slate-400 text-xs mt-1 leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-4 max-w-4xl mx-auto w-full text-center">
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
          Ready to turn payments into verified proof?
        </h2>
        <p className="text-slate-600 text-base mt-2 max-w-xl mx-auto">
          Start receiving real USDC and XLM payments today with Pollar.
        </p>
        <div className="mt-6 flex justify-center">
          <Link
            href="/receive"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3.5 text-base font-semibold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700 active:scale-[0.98] transition-all"
          >
            <span>Create Your First Payment Request</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
