"use client";

import Link from "next/link";
import Image from "next/image";
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
  Sparkles,
  Share2,
  Lock,
  Coins,
  BadgeCheck,
  HeartHandshake,
  Smartphone,
  Layers,
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
    payerName: "Acme Creative Studio",
    description: "Brand Identity & Web Development",
    amount: "50.00",
    currency: "USDC",
    status: "successful",
    memo: "CR-78E29A",
    createdAt: new Date().toISOString(),
    paidAt: new Date().toISOString(),
  };

  const personas = [
    {
      role: "Fashion Designers & Tailors",
      tagline: "Every stitch valued & documented",
      desc: "Instant mobile payment links sent via WhatsApp for bespoke outfits, alterations, and fabric sales, complete with printable receipts.",
      image: "/images/worker-tailor-artisan.jpg",
      badge: "Artisan & Apparel",
    },
    {
      role: "Software Engineers & Creatives",
      tagline: "Global reach, verifiable track record",
      desc: "Receive cross-border project milestones in USDC and build an auditable income portfolio for visas, loans, and leasing.",
      image: "/images/worker-developer.jpg",
      badge: "Tech & Remote Work",
    },
    {
      role: "Merchants & Boutique Owners",
      tagline: "Dignity in daily storefront commerce",
      desc: "Turn countertop sales and marketplace orders into immutable proof of steady revenue without expensive POS machines.",
      image: "/images/worker-artisan-entrepreneur.jpg",
      badge: "Retail & Services",
    },
  ];

  return (
    <div className="flex flex-col gap-20 sm:gap-28 pb-24 overflow-hidden">
      {/* Hero Section */}
      <section className="relative px-4 pt-8 sm:pt-14 lg:pt-16 max-w-7xl mx-auto w-full">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-80 bg-gradient-to-b from-[#075E54]/10 via-[#F2A900]/5 to-transparent blur-3xl -z-10 pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Emotionally Engaging Headline & Value Prop */}
          <div className="lg:col-span-7 text-left">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#075E54]/20 bg-[#075E54]/5 px-3.5 py-1.5 text-xs font-semibold text-[#075E54] shadow-2xs mb-6">
              <span className="flex h-2 w-2 rounded-full bg-[#16A085] animate-ping" />
              <Sparkles className="h-3.5 w-3.5 text-[#F2A900]" />
              <span className="tracking-wide">Modern African Fintech &bull; Non-Custodial</span>
            </div>

            <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-[#102A2A] leading-[1.12]">
              Your work deserves to be remembered.{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#075E54] via-[#16A085] to-[#F2A900]">
                Turn every payment into proof of income.
              </span>
            </h1>

            <p className="mt-6 text-base sm:text-lg text-[#5F6F6D] max-w-xl leading-relaxed">
              A warm, human-first financial platform empowering African freelancers, creators, artisans, and small business owners to receive direct payments, issue verifiable digital receipts, and build lasting financial dignity.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5">
              {isAuthenticated ? (
                <Link
                  href="/receive"
                  className="inline-flex items-center justify-center gap-2.5 rounded-xl bg-[#075E54] px-6 py-4 text-base font-bold text-white shadow-lg shadow-[#075E54]/25 hover:bg-[#064e46] active:scale-[0.98] transition-all"
                >
                  <span>Request a Payment</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              ) : (
                <button
                  onClick={login}
                  className="inline-flex items-center justify-center gap-2.5 rounded-xl bg-[#075E54] px-6 py-4 text-base font-bold text-white shadow-lg shadow-[#075E54]/25 hover:bg-[#064e46] active:scale-[0.98] transition-all cursor-pointer"
                >
                  <span>Start with Pollar</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              )}

              <a
                href="#how-it-works"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#075E54]/20 bg-white/80 backdrop-blur px-6 py-4 text-base font-semibold text-[#102A2A] hover:bg-white hover:border-[#075E54]/40 transition-all shadow-2xs"
              >
                <span>How It Works</span>
              </a>
            </div>

            {/* Reassurance pills */}
            <div className="mt-8 flex flex-wrap items-center gap-y-2 gap-x-5 text-xs text-[#5F6F6D] font-medium">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-[#16A085]" />
                Zero custodial risk
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-[#16A085]" />
                Direct Stellar settlement
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-[#16A085]" />
                100% verifiable on-chain
              </span>
            </div>
          </div>

          {/* Right Column: Authentic Photography & Floating Proof Card */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              {/* Decorative warm frame shadow */}
              <div className="absolute -inset-2 rounded-3xl bg-gradient-to-tr from-[#F2A900]/20 via-[#075E54]/10 to-[#16A085]/20 blur-xl opacity-70 -z-10" />

              {/* Main Photo Card */}
              <div className="relative rounded-3xl overflow-hidden border-2 border-white/80 bg-white shadow-2xl shadow-[#102A2A]/10">
                <div className="relative h-80 sm:h-96 w-full">
                  <Image
                    src="/images/hero-african-freelancer.jpg"
                    alt="African creative receiving payment confirmation on phone"
                    fill
                    priority
                    className="object-cover object-center"
                    sizes="(max-width: 768px) 100vw, 500px"
                  />
                  {/* Subtle gradient overlay to enhance readability */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#102A2A]/80 via-transparent to-transparent" />

                  {/* Photo Caption Overlay */}
                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-white/20 backdrop-blur-md px-2.5 py-0.5 text-2xs font-semibold text-white mb-1.5">
                      <Sparkles className="h-3 w-3 text-[#F2A900]" />
                      Real People. Real Work.
                    </div>
                    <p className="text-sm font-semibold text-white/95 leading-snug">
                      "With Chamba Receipts, clients take my pricing seriously and I have undeniable proof of what I earn."
                    </p>
                    <p className="text-2xs text-[#F2A900] font-medium mt-0.5">
                      Blessing E. &bull; Lagos, Nigeria
                    </p>
                  </div>
                </div>

                {/* Floating Payment Notification Card */}
                <div className="p-4 bg-white/95 backdrop-blur border-t border-[#075E54]/10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-[#16A085]/15 flex items-center justify-center text-[#075E54] font-bold">
                      <BadgeCheck className="h-5 w-5 text-[#16A085]" />
                    </div>
                    <div>
                      <div className="text-xs text-[#5F6F6D] font-medium">Just received</div>
                      <div className="text-sm font-bold text-[#102A2A]">USDC 50.00 &bull; Web Studio</div>
                    </div>
                  </div>
                  <span className="inline-flex items-center rounded-full bg-[#16A085]/10 px-2.5 py-1 text-2xs font-bold text-[#075E54]">
                    Verified
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Live Metrics Strip */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto rounded-2xl border border-[#075E54]/15 bg-white/70 backdrop-blur p-6 shadow-sm text-center">
          <div>
            <div className="font-heading text-2xl sm:text-3xl font-black text-[#075E54]">100%</div>
            <div className="text-xs text-[#5F6F6D] font-semibold mt-1">Non-Custodial</div>
          </div>
          <div>
            <div className="font-heading text-2xl sm:text-3xl font-black text-[#F2A900]">0 Fees</div>
            <div className="text-xs text-[#5F6F6D] font-semibold mt-1">Stellar Gas Sponsored</div>
          </div>
          <div>
            <div className="font-heading text-2xl sm:text-3xl font-black text-[#075E54]">&lt; 3 sec</div>
            <div className="text-xs text-[#5F6F6D] font-semibold mt-1">Final Settlement</div>
          </div>
          <div>
            <div className="font-heading text-2xl sm:text-3xl font-black text-[#16A085]">USDC + XLM</div>
            <div className="text-xs text-[#5F6F6D] font-semibold mt-1">Dual Asset Support</div>
          </div>
        </div>
      </section>

      {/* Story & Philosophy Section: "Real people. Real work. Real progress." */}
      <section className="px-4 max-w-7xl mx-auto w-full">
        <div className="rounded-3xl bg-gradient-to-br from-[#075E54] via-[#064e46] to-[#102A2A] text-white p-8 sm:p-14 lg:p-16 relative overflow-hidden shadow-xl">
          {/* Background decorative elements */}
          <div className="absolute top-0 right-0 -mt-12 -mr-12 w-80 h-80 rounded-full bg-[#F2A900]/10 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-80 h-80 rounded-full bg-[#16A085]/20 blur-3xl pointer-events-none" />

          <div className="relative max-w-3xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F2A900]/20 px-3 py-1 text-xs font-bold text-[#F2A900] tracking-wide uppercase mb-4">
              <HeartHandshake className="h-3.5 w-3.5" />
              The Chamba Philosophy
            </span>
            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
              Real people. Real work. Real progress.
            </h2>
            <p className="mt-4 text-base sm:text-lg text-white/80 leading-relaxed font-normal">
              Across Africa, millions of informal workers, artisans, and digital builders earn legitimate income every single day. Yet, when they walk into a bank or lease office, they are told they have no &ldquo;official proof of earnings.&rdquo;
            </p>
            <p className="mt-3 text-base text-white/70 leading-relaxed font-normal">
              Chamba Receipts bridges this divide without asking you to surrender control of your funds. Every transaction is non-custodial, stamped on the Stellar blockchain, and formatted into an immutable financial dossier that proves your diligence.
            </p>
          </div>

          <div className="relative mt-10 grid grid-cols-1 md:grid-cols-3 gap-6 pt-8 border-t border-white/15">
            <div>
              <div className="text-xl font-bold text-[#F2A900] flex items-center gap-2">
                <ShieldCheck className="h-5 w-5" />
                Never Held in Escrow
              </div>
              <p className="text-xs text-white/75 mt-1.5 leading-relaxed">
                Funds travel directly from your client&apos;s wallet to yours. We never touch, hold, or restrict your hard-earned money.
              </p>
            </div>
            <div>
              <div className="text-xl font-bold text-[#F2A900] flex items-center gap-2">
                <FileCheck className="h-5 w-5" />
                Audit-Ready Receipts
              </div>
              <p className="text-xs text-white/75 mt-1.5 leading-relaxed">
                Clean digital receipts with cryptographic transaction IDs, payer attribution, and download-ready PDF statements.
              </p>
            </div>
            <div>
              <div className="text-xl font-bold text-[#F2A900] flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Build Financial Identity
              </div>
              <p className="text-xs text-white/75 mt-1.5 leading-relaxed">
                Transform sporadic freelance gig payouts into an unbroken track record of verifiable income over time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Built For Real Work: Persona Cards with Authentic Photography */}
      <section className="px-4 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs font-bold uppercase tracking-widest text-[#075E54]">
            Dignity in Every Trade
          </span>
          <h2 className="font-heading text-3xl sm:text-4xl font-black tracking-tight text-[#102A2A] mt-2">
            Built for Real Work
          </h2>
          <p className="text-[#5F6F6D] text-base mt-2">
            Whether you work with code, cloth, or countertop retail, your labor holds true value.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {personas.map((p) => (
            <div
              key={p.role}
              className="group rounded-3xl border border-[#075E54]/15 bg-white overflow-hidden shadow-sm hover:shadow-xl hover:border-[#075E54]/30 transition-all duration-300 flex flex-col"
            >
              {/* Photo */}
              <div className="relative h-60 w-full overflow-hidden bg-slate-100">
                <Image
                  src={p.image}
                  alt={p.role}
                  fill
                  className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
                  sizes="(max-width: 768px) 100vw, 400px"
                />
                <div className="absolute top-3 right-3">
                  <span className="inline-flex items-center rounded-full bg-white/90 backdrop-blur px-3 py-1 text-2xs font-bold text-[#075E54] shadow-2xs">
                    {p.badge}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-heading text-xl font-bold text-[#102A2A]">
                    {p.role}
                  </h3>
                  <div className="text-xs font-semibold text-[#16A085] mt-1">
                    {p.tagline}
                  </div>
                  <p className="text-xs text-[#5F6F6D] mt-3 leading-relaxed">
                    {p.desc}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-[#075E54]">
                  <span>Instant receipts on WhatsApp</span>
                  <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works: Step by Step Dignity Flow */}
      <section id="how-it-works" className="px-4 py-12 max-w-7xl mx-auto w-full border-t border-[#075E54]/10">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs font-bold uppercase tracking-widest text-[#075E54]">
            Frictionless & Human
          </span>
          <h2 className="font-heading text-3xl sm:text-4xl font-black tracking-tight text-[#102A2A] mt-2">
            How Chamba Receipts Works
          </h2>
          <p className="text-[#5F6F6D] text-base mt-2">
            Four simple steps that turn client handshakes into undeniable blockchain proof.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="rounded-2xl border border-[#075E54]/15 bg-white p-6 shadow-2xs hover:border-[#075E54]/40 transition-all">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#075E54]/10 text-[#075E54] font-black text-lg mb-4">
              1
            </div>
            <h3 className="font-heading text-base font-bold text-[#102A2A]">Create Request</h3>
            <p className="text-xs text-[#5F6F6D] mt-2 leading-relaxed">
              Define the amount, currency (USDC or XLM), payer identity, and clear description of the work delivered.
            </p>
          </div>

          <div className="rounded-2xl border border-[#075E54]/15 bg-white p-6 shadow-2xs hover:border-[#075E54]/40 transition-all">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F2A900]/15 text-[#F2A900] font-black text-lg mb-4">
              2
            </div>
            <h3 className="font-heading text-base font-bold text-[#102A2A]">Share Dignified Link</h3>
            <p className="text-xs text-[#5F6F6D] mt-2 leading-relaxed">
              Send a polished mobile checkout page directly to your customer via WhatsApp, Telegram, or QR code.
            </p>
          </div>

          <div className="rounded-2xl border border-[#075E54]/15 bg-white p-6 shadow-2xs hover:border-[#075E54]/40 transition-all">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#16A085]/15 text-[#16A085] font-black text-lg mb-4">
              3
            </div>
            <h3 className="font-heading text-base font-bold text-[#102A2A]">Instant Pollar Pay</h3>
            <p className="text-xs text-[#5F6F6D] mt-2 leading-relaxed">
              Client approves with one click using their Pollar wallet. Instant on-chain settlement without intermediaries.
            </p>
          </div>

          <div className="rounded-2xl border border-[#075E54]/15 bg-white p-6 shadow-2xs hover:border-[#075E54]/40 transition-all">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#075E54]/10 text-[#075E54] font-black text-lg mb-4">
              4
            </div>
            <h3 className="font-heading text-base font-bold text-[#102A2A]">Proof & Track Record</h3>
            <p className="text-xs text-[#5F6F6D] mt-2 leading-relaxed">
              Horizon verifies the transaction. An immutable receipt is issued and recorded into your income story.
            </p>
          </div>
        </div>
      </section>

      {/* Example Receipt Demonstration */}
      <section className="px-4 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs font-bold uppercase tracking-widest text-[#16A085]">
            Verifiable on Stellar Horizon
          </span>
          <h2 className="font-heading text-3xl sm:text-4xl font-black tracking-tight text-[#102A2A] mt-2">
            The Digital Receipt
          </h2>
          <p className="text-[#5F6F6D] text-sm mt-2">
            Every payment confirmed generates a permanent, shareable receipt with cryptographic verification.
          </p>
        </div>

        <ReceiptCard record={exampleReceipt} showActions={true} />
      </section>

      {/* Final Warm CTA */}
      <section className="px-4 max-w-4xl mx-auto w-full text-center">
        <div className="rounded-3xl border border-[#075E54]/20 bg-white p-8 sm:p-12 shadow-sm relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#F2A900]/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-[#075E54]/10 rounded-full blur-2xl pointer-events-none" />

          <h2 className="font-heading text-3xl sm:text-4xl font-black tracking-tight text-[#102A2A]">
            Your next payment deserves a record.
          </h2>
          <p className="text-[#5F6F6D] text-base mt-3 max-w-xl mx-auto">
            Join artisans, creators, and freelancers building financial dignity with every transaction.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row justify-center gap-3.5">
            {isAuthenticated ? (
              <Link
                href="/receive"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#075E54] px-7 py-4 text-base font-bold text-white shadow-lg shadow-[#075E54]/20 hover:bg-[#064e46] active:scale-[0.98] transition-all"
              >
                <span>Create Your Payment Link</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <button
                onClick={login}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#075E54] px-7 py-4 text-base font-bold text-white shadow-lg shadow-[#075E54]/20 hover:bg-[#064e46] active:scale-[0.98] transition-all cursor-pointer"
              >
                <span>Start Free with Pollar</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            )}

            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#075E54]/25 bg-[#F8F7F2] px-6 py-4 text-base font-semibold text-[#102A2A] hover:bg-white transition-all"
            >
              <span>Explore Dashboard</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
