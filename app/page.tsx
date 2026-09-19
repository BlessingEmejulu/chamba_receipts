"use client";

import Link from "next/link";
import Image from "next/image";
import { usePollarAuth } from "@/hooks/usePollarAuth";
import { ReceiptCard } from "@/components/ReceiptCard";
import { Mark, Corners, Eyebrow, Seam } from "@/components/blackout";
import { PaymentRecord } from "@/lib/storage";
import {
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  FileCheck,
  HeartHandshake,
} from "lucide-react";

/**
 * The specimen receipt below is server-rendered. A live clock would produce a
 * different value on the server than on the client a moment later, so its
 * checksum -- which is derived from the timestamp -- would not match on
 * hydration. A fixed instant keeps the demo deterministic.
 */
const DEMO_ISSUED_AT = "2026-03-14T09:24:00.000Z";

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
    createdAt: DEMO_ISSUED_AT,
    paidAt: DEMO_ISSUED_AT,
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

  const metrics = [
    { value: "100%", label: "Non-custodial", tone: "text-teal" },
    { value: "0 Fees", label: "Gas sponsored", tone: "text-gold" },
    { value: "< 3s", label: "Final settlement", tone: "text-aqua" },
    { value: "2", label: "Assets: USDC + XLM", tone: "text-ink" },
  ];

  const steps = [
    {
      n: "01",
      title: "Create request",
      body: "Define the amount, currency, payer identity, and a clear description of the work delivered.",
    },
    {
      n: "02",
      title: "Share the link",
      body: "Send a polished mobile checkout page to your customer via WhatsApp, Telegram, or QR code.",
    },
    {
      n: "03",
      title: "Instant settlement",
      body: "The client approves in one click with Pollar. Direct on-chain transfer, no intermediaries.",
    },
    {
      n: "04",
      title: "Proof issued",
      body: "Horizon verifies the transaction. An immutable receipt is recorded into your income history.",
    },
  ];

  return (
    <div className="flex flex-col">
      {/* ================= HERO ================= */}
      <section className="relative overflow-hidden border-b border-line-2">
        <div className="bo-grid pointer-events-none absolute inset-0" aria-hidden="true" />
        <div
          className="pointer-events-none absolute left-1/2 top-0 h-[420px] w-[820px] -translate-x-1/2 bg-[radial-gradient(ellipse_at_center,rgba(44,197,160,0.10),transparent_70%)]"
          aria-hidden="true"
        />

        <div className="bo-rails relative mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-12 py-16 lg:grid-cols-12 lg:gap-10 lg:py-24">
            <div className="lg:col-span-7">
              <Eyebrow live>Non-custodial &middot; Stellar settlement</Eyebrow>

              <h1 className="bo-display mt-7 text-4xl text-ink sm:text-5xl lg:text-6xl">
                Your work deserves to be remembered.
                <span className="mt-2 block text-teal">
                  Turn every payment into proof of income.
                </span>
              </h1>

              <p className="mt-6 max-w-xl text-base leading-relaxed text-ink-2">
                A financial instrument for African freelancers, creators, artisans and
                small business owners: receive direct payments, issue verifiable digital
                receipts, and build a track record that institutions accept.
              </p>

              <div className="mt-9 flex flex-col items-stretch gap-px bg-line-2 sm:flex-row sm:items-center sm:bg-transparent sm:gap-3">
                {isAuthenticated ? (
                  <Link
                    href="/receive"
                    className="bo-btn bo-btn-primary px-6 py-4 text-sm uppercase tracking-[0.1em]"
                  >
                    <span>Request a payment</span>
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                ) : (
                  <button
                    onClick={login}
                    className="bo-btn bo-btn-primary px-6 py-4 text-sm uppercase tracking-[0.1em]"
                  >
                    <span>Start with Pollar</span>
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </button>
                )}

                <a
                  href="#how-it-works"
                  className="bo-btn bo-btn-ghost px-6 py-4 text-sm uppercase tracking-[0.1em]"
                >
                  How it works
                </a>
              </div>

              <ul className="mt-9 flex flex-wrap gap-x-8 gap-y-3">
                {["Zero custodial risk", "Direct Stellar settlement", "Verifiable on-chain"].map(
                  (item) => (
                    <li key={item} className="flex items-center gap-2.5">
                      <Mark accent />
                      <span className="bo-label-sm">{item}</span>
                    </li>
                  )
                )}
              </ul>
            </div>

            {/* Photography panel */}
            <div className="lg:col-span-5">
              <div className="bo-panel relative">
                <Corners accent />

                <div className="bo-media relative h-80 w-full sm:h-96">
                  <Image
                    src="/images/hero-african-freelancer.jpg"
                    alt="African creative receiving payment confirmation on her phone"
                    fill
                    priority
                    className="object-cover object-center"
                    sizes="(max-width: 768px) 100vw, 500px"
                  />
                  <div className="absolute inset-x-0 bottom-0 z-10 p-5">
                    <div className="bo-chip bo-chip-gold mb-3">Real people. Real work.</div>
                    <p className="text-sm font-medium leading-snug text-ink">
                      &ldquo;With Chamba Receipts, clients take my pricing seriously and I
                      have undeniable proof of what I earn.&rdquo;
                    </p>
                    <p className="bo-label-sm mt-2 text-gold">
                      Blessing E. &middot; Lagos, Nigeria
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4 border-t border-line-2 px-4 py-3.5">
                  <div className="flex items-center gap-3">
                    <span className="bo-pulse" aria-hidden="true" />
                    <div>
                      <div className="bo-label-sm">Just received</div>
                      <div className="bo-num mt-1 text-sm font-medium text-ink">
                        50.00 USDC &middot; Web Studio
                      </div>
                    </div>
                  </div>
                  <span className="bo-chip bo-chip-ok">Verified</span>
                </div>
              </div>
            </div>
          </div>

          {/* Instrument strip */}
          <div className="grid grid-cols-2 gap-px border-t border-line-2 bg-line-2 md:grid-cols-4">
            {metrics.map((m) => (
              <div key={m.label} className="bg-canvas px-5 py-6">
                <div className={`bo-display bo-num text-2xl sm:text-3xl ${m.tone}`}>
                  {m.value}
                </div>
                <div className="bo-label-sm mt-2.5">{m.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= PHILOSOPHY ================= */}
      <section className="relative border-b border-line-2 bg-surface-1">
        <div className="bo-rails mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <Eyebrow>The Chamba philosophy</Eyebrow>

          <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <h2 className="bo-display text-3xl text-ink sm:text-4xl lg:text-5xl">
                Real people. Real work.
                <br />
                Real progress.
              </h2>
            </div>
            <div className="space-y-4 lg:col-span-5">
              <p className="text-base leading-relaxed text-ink-2">
                Across Africa, millions of informal workers, artisans and digital builders
                earn legitimate income every single day. Yet when they walk into a bank or
                a lease office, they are told they have no official proof of earnings.
              </p>
              <p className="text-sm leading-relaxed text-ink-3">
                Chamba Receipts bridges that divide without asking you to surrender control
                of your funds. Every transaction is non-custodial, stamped on the Stellar
                ledger, and formatted into a financial dossier that proves your diligence.
              </p>
            </div>
          </div>

          <div className="mt-14 grid grid-cols-1 gap-px bg-line-2 md:grid-cols-3">
            {[
              {
                icon: ShieldCheck,
                title: "Never held in escrow",
                body: "Funds travel directly from your client's wallet to yours. We never touch, hold, or restrict your money.",
              },
              {
                icon: FileCheck,
                title: "Audit-ready receipts",
                body: "Clean digital receipts with cryptographic transaction IDs, payer attribution, and printable statements.",
              },
              {
                icon: TrendingUp,
                title: "Build financial identity",
                body: "Transform sporadic freelance payouts into an unbroken track record of verifiable income over time.",
              },
            ].map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="group bg-surface-1 p-7">
                  <Icon className="h-5 w-5 text-gold" aria-hidden="true" />
                  <h3 className="bo-heading mt-5 text-base font-medium text-ink">
                    {f.title}
                  </h3>
                  <p className="mt-2.5 text-sm leading-relaxed text-ink-3">{f.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ================= PERSONAS ================= */}
      <section className="relative border-b border-line-2">
        <div className="bo-rails mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <Eyebrow>Dignity in every trade</Eyebrow>
          <div className="mt-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <h2 className="bo-display max-w-lg text-3xl text-ink sm:text-4xl">
              Built for real work
            </h2>
            <p className="max-w-sm text-sm leading-relaxed text-ink-3">
              Whether you work with code, cloth, or countertop retail, your labour holds
              true value.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-px bg-line-2 md:grid-cols-3">
            {personas.map((p) => (
              <article key={p.role} className="group flex flex-col bg-canvas">
                <div className="bo-media relative h-56 w-full">
                  <Image
                    src={p.image}
                    alt={p.role}
                    fill
                    className="object-cover object-center transition-transform duration-500 group-hover:scale-[1.04]"
                    sizes="(max-width: 768px) 100vw, 400px"
                  />
                  <span className="bo-chip absolute right-3 top-3 z-10 bg-canvas/80 backdrop-blur">
                    {p.badge}
                  </span>
                </div>

                <div className="flex flex-1 flex-col justify-between p-6">
                  <div>
                    <h3 className="bo-heading text-lg font-medium text-ink">{p.role}</h3>
                    <div className="bo-label-sm mt-2 text-teal">{p.tagline}</div>
                    <p className="mt-4 text-sm leading-relaxed text-ink-3">{p.desc}</p>
                  </div>

                  <div className="mt-7 flex items-center justify-between border-t border-line-1 pt-4">
                    <span className="bo-label-sm">Receipts on WhatsApp</span>
                    <ArrowRight
                      className="h-3.5 w-3.5 text-teal transition-transform group-hover:translate-x-1"
                      aria-hidden="true"
                    />
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ================= HOW IT WORKS ================= */}
      <section
        id="how-it-works"
        className="relative border-b border-line-2 bg-surface-1"
      >
        <div className="bo-grid-fine pointer-events-none absolute inset-0 opacity-50" aria-hidden="true" />
        <div className="bo-rails relative mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <Eyebrow>Frictionless &amp; human</Eyebrow>
          <h2 className="bo-display mt-8 max-w-xl text-3xl text-ink sm:text-4xl">
            How Chamba Receipts works
          </h2>
          <p className="mt-4 max-w-lg text-sm leading-relaxed text-ink-3">
            Four steps that turn a client handshake into undeniable blockchain proof.
          </p>

          <div className="mt-14 grid grid-cols-1 gap-px bg-line-2 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s) => (
              <div key={s.n} className="relative bg-surface-1 p-7">
                <div className="flex items-center gap-3">
                  <span className="bo-code text-2xl font-medium text-teal">{s.n}</span>
                  <span className="h-px flex-1 bg-line-2" aria-hidden="true" />
                  <Mark />
                </div>
                <h3 className="bo-heading mt-6 text-base font-medium text-ink">
                  {s.title}
                </h3>
                <p className="mt-2.5 text-sm leading-relaxed text-ink-3">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= RECEIPT SPECIMEN ================= */}
      <section className="relative border-b border-line-2">
        <div className="bo-rails mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <Eyebrow>Verifiable on Stellar Horizon</Eyebrow>
          <div className="mt-8 text-center">
            <h2 className="bo-display text-3xl text-ink sm:text-4xl">The digital receipt</h2>
            <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-ink-3">
              Every confirmed payment generates a permanent, shareable document with
              cryptographic verification.
            </p>
          </div>

          <div className="mt-12">
            <ReceiptCard record={exampleReceipt} showActions={true} />
          </div>
        </div>
      </section>

      {/* ================= CTA ================= */}
      <section className="relative">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(44,197,160,0.08),transparent_70%)]"
          aria-hidden="true"
        />
        <div className="bo-rails relative mx-auto w-full max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <Seam className="mb-14" />

          <div className="mx-auto max-w-2xl text-center">
            <HeartHandshake className="mx-auto h-6 w-6 text-gold" aria-hidden="true" />
            <h2 className="bo-display mt-7 text-3xl text-ink sm:text-4xl">
              Your next payment deserves a record.
            </h2>
            <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-ink-2">
              Join artisans, creators and freelancers building financial dignity with
              every transaction.
            </p>

            <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
              {isAuthenticated ? (
                <Link
                  href="/receive"
                  className="bo-btn bo-btn-primary px-7 py-4 text-sm uppercase tracking-[0.1em]"
                >
                  <span>Create your payment link</span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              ) : (
                <button
                  onClick={login}
                  className="bo-btn bo-btn-primary px-7 py-4 text-sm uppercase tracking-[0.1em]"
                >
                  <span>Start free with Pollar</span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>
              )}

              <Link
                href="/dashboard"
                className="bo-btn bo-btn-ghost px-6 py-4 text-sm uppercase tracking-[0.1em]"
              >
                Explore dashboard
              </Link>
            </div>
          </div>

          <Seam className="mt-14" />
        </div>
      </section>
    </div>
  );
}
