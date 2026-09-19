"use client";

import { useState } from "react";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { usePollarAuth } from "@/hooks/usePollarAuth";
import { useBalance } from "@/hooks/useBalance";
import { savePaymentRequest, PaymentRequest, generateId } from "@/lib/storage";
import { shortAddress, formatAmount } from "@/lib/stellar";
import { Mark, Corners, Eyebrow } from "@/components/blackout";
import {
  PlusCircle,
  Copy,
  Check,
  ExternalLink,
  Receipt,
  QrCode,
  AlertCircle,
  Share2,
  Info,
  ArrowRight,
} from "lucide-react";

export default function ReceivePaymentPage() {
  const { user, isAuthenticated, login } = usePollarAuth();
  const { balances } = useBalance();

  const [amount, setAmount] = useState("50");
  const [currency, setCurrency] = useState<"USDC" | "XLM">("USDC");
  const [description, setDescription] = useState("Brand Identity & Web Development");
  const [customerName, setCustomerName] = useState("");
  const [paymentReference, setPaymentReference] = useState("");

  const hasUsdcTrustline = balances.some((b) => b.code === "USDC");

  const [createdRequest, setCreatedRequest] = useState<PaymentRequest | null>(null);
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError("Please enter a valid payment amount greater than zero.");
      return;
    }

    if (!description.trim()) {
      setError("Please enter a short description for what this payment is for.");
      return;
    }

    if (!user?.address) {
      setError("Please connect your Pollar wallet first.");
      return;
    }

    setIsSubmitting(true);

    const reqId = generateId("REQ");
    const memoId = `CR-${reqId.slice(-6)}`; // Max 28 chars Stellar text memo

    const newRequest: PaymentRequest = {
      id: reqId,
      workerAddress: user.address,
      workerName: user.displayName || user.email || "Independent Worker",
      customerName: customerName.trim() || undefined,
      description: description.trim(),
      amount: parsedAmount.toFixed(2),
      currency,
      paymentReference: paymentReference.trim() || undefined,
      memo: memoId,
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    savePaymentRequest(newRequest);
    setCreatedRequest(newRequest);
    setIsSubmitting(false);
  };

  const buildPaymentPageUrl = (req: PaymentRequest): string => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const params = new URLSearchParams({
      to: req.workerAddress,
      amt: req.amount,
      cur: req.currency,
      memo: req.memo,
      desc: req.description,
    });
    if (req.workerName) params.set("worker", req.workerName);
    if (req.customerName) params.set("customer", req.customerName);
    return `${origin}/pay/${req.id}?${params.toString()}`;
  };

  const paymentPageUrl = createdRequest ? buildPaymentPageUrl(createdRequest) : "";

  const handleCopyLink = async () => {
    if (!paymentPageUrl) return;
    try {
      await navigator.clipboard.writeText(paymentPageUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback
    }
  };

  const buildWhatsAppShareUrl = () => {
    if (!createdRequest || !paymentPageUrl) return "";
    const text = `Hello! Here is the secure payment link for "${createdRequest.description}" (${formatAmount(createdRequest.amount)} ${createdRequest.currency}):\n${paymentPageUrl}\n\nPaid via Chamba Receipts. You will receive an instant digital receipt upon payment.`;
    return `https://wa.me/?text=${encodeURIComponent(text)}`;
  };

  if (!isAuthenticated) {
    return (
      <div className="mx-auto flex max-w-md flex-1 flex-col items-center justify-center px-4 py-24 text-center">
        <span className="flex h-12 w-12 items-center justify-center border border-line-2 bg-surface-2">
          <Receipt className="h-5 w-5 text-teal" aria-hidden="true" />
        </span>
        <h1 className="bo-display mt-7 text-3xl text-ink">
          Sign in to create payment requests
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-ink-2">
          Connect your Pollar wallet so incoming customer payments arrive directly in your
          non-custodial Stellar address.
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
    <div className="bo-rails mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="border-b border-line-2 pb-8">
        <Eyebrow live>Dignified invoicing</Eyebrow>
        <h1 className="bo-display mt-5 text-3xl text-ink sm:text-4xl">
          Get paid for your work.
        </h1>
        <p className="mt-3 max-w-xl text-sm text-ink-2">
          Create a clear payment request and send it to your customer. Once paid, a digital
          receipt is issued immediately.
        </p>
      </div>

      <div className="mt-8 grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
        {/* ============ FORM ============ */}
        <div className="lg:col-span-7">
          <form onSubmit={handleSubmit} className="bo-panel relative p-6 sm:p-8">
            <Corners />

            <div className="flex items-center gap-3">
              <Mark accent />
              <h2 className="bo-label text-ink">Request parameters</h2>
              <span className="h-px flex-1 bg-line-1" aria-hidden="true" />
            </div>

            {error && (
              <div
                role="alert"
                className="bo-note bo-note-error mt-6 flex items-start gap-3 p-4"
              >
                <AlertCircle
                  className="mt-0.5 h-4 w-4 shrink-0 text-coral"
                  aria-hidden="true"
                />
                <span className="text-xs leading-relaxed text-ink">{error}</span>
              </div>
            )}

            {/* Receiving wallet */}
            <div className="bo-panel-inset mt-6 p-4">
              <div className="bo-label-sm">Your Pollar receiving wallet</div>
              <div className="bo-code mt-2 break-all text-xs text-ink">
                {shortAddress(user?.address || "", 12, 10)}
              </div>
            </div>

            {/* Amount & currency */}
            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-5">
              <div className="space-y-2.5 sm:col-span-3">
                <label htmlFor="amount" className="bo-label block">
                  Amount
                </label>
                <input
                  id="amount"
                  type="number"
                  inputMode="decimal"
                  step="any"
                  min="0.01"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="50.00"
                  className="bo-field bo-field-num py-3.5 text-lg font-medium"
                />
              </div>

              <div className="space-y-2.5 sm:col-span-2">
                <span className="bo-label block" id="currency-label">
                  Currency
                </span>
                <div
                  className="bo-segment w-full"
                  role="group"
                  aria-labelledby="currency-label"
                >
                  {(["USDC", "XLM"] as const).map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCurrency(c)}
                      data-active={currency === c}
                      aria-pressed={currency === c}
                      className="flex-1 py-3.5!"
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Trustline notice */}
            {currency === "USDC" && !hasUsdcTrustline && (
              <div className="bo-note bo-note-warn mt-5 flex items-start gap-3 p-4">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden="true" />
                <div className="text-xs leading-relaxed text-ink-2">
                  <span className="font-medium text-gold">Trustline required.</span> To
                  receive USDC your Stellar wallet must establish a USDC trustline. Add it
                  in one click from your{" "}
                  <Link href="/profile" className="font-medium text-teal underline">
                    profile
                  </Link>
                  , or switch this request to{" "}
                  <button
                    type="button"
                    onClick={() => setCurrency("XLM")}
                    className="cursor-pointer font-medium text-teal underline"
                  >
                    XLM
                  </button>
                  , which needs no trustline.
                </div>
              </div>
            )}

            {/* Description */}
            <div className="mt-6 space-y-2.5">
              <label htmlFor="description" className="bo-label block">
                Description / service
              </label>
              <input
                id="description"
                type="text"
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Website development, tailored kaftan, photography"
                aria-describedby="description-hint"
                className="bo-field"
              />
              <p id="description-hint" className="text-2xs leading-relaxed text-ink-3">
                This appears on your customer&apos;s checkout screen and on the digital
                proof of income.
              </p>
            </div>

            {/* Customer */}
            <div className="mt-6 space-y-2.5">
              <label htmlFor="customer" className="bo-label block">
                Customer name{" "}
                <span className="text-ink-4 normal-case tracking-normal">optional</span>
              </label>
              <input
                id="customer"
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Acme Studio or Kemi Adeleke"
                className="bo-field"
              />
            </div>

            {/* Reference */}
            <div className="mt-6 space-y-2.5">
              <label htmlFor="reference" className="bo-label block">
                Invoice reference{" "}
                <span className="text-ink-4 normal-case tracking-normal">optional</span>
              </label>
              <input
                id="reference"
                type="text"
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
                placeholder="INV-2026-001"
                className="bo-field bo-code"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="bo-btn bo-btn-primary mt-8 w-full px-6 py-4 text-sm uppercase tracking-[0.12em]"
            >
              <PlusCircle className="h-4 w-4" aria-hidden="true" />
              <span>{isSubmitting ? "Generating" : "Generate payment link"}</span>
            </button>
          </form>
        </div>

        {/* ============ OUTPUT ============ */}
        <div className="lg:col-span-5 lg:sticky lg:top-24">
          {createdRequest ? (
            <div className="bo-panel-live bo-enter relative p-6 sm:p-7">
              <Corners accent />

              <div className="flex items-center gap-3">
                <span className="bo-pulse" aria-hidden="true" />
                <h2 className="bo-label text-teal">Payment request ready</h2>
                <span className="h-px flex-1 bg-line-1" aria-hidden="true" />
              </div>

              {/* Share actions */}
              <div className="mt-6 space-y-3">
                <a
                  href={buildWhatsAppShareUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bo-btn bo-btn-primary w-full px-4 py-3.5 text-xs uppercase tracking-[0.1em]"
                >
                  <Share2 className="h-4 w-4" aria-hidden="true" />
                  <span>Share via WhatsApp</span>
                </a>

                <div className="flex items-stretch gap-px bg-line-2">
                  <input
                    readOnly
                    value={paymentPageUrl}
                    aria-label="Payment link"
                    className="bo-field bo-code min-w-0 flex-1 py-2.5 text-2xs"
                  />
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="bo-btn bo-btn-secondary w-11 shrink-0"
                    title="Copy payment link"
                    aria-label="Copy payment link"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-teal" aria-hidden="true" />
                    ) : (
                      <Copy className="h-4 w-4" aria-hidden="true" />
                    )}
                  </button>
                </div>
                <span aria-live="polite" className="block text-2xs text-teal">
                  {copied ? "Link copied to clipboard" : ""}
                </span>
              </div>

              {/* QR */}
              <div className="bo-panel-inset mt-6 flex flex-col items-center p-6">
                <div className="bg-white p-3">
                  <QRCodeSVG value={paymentPageUrl} size={152} level="M" />
                </div>
                <span className="bo-label-sm mt-4 text-center">
                  Point client camera here to pay
                </span>
              </div>

              {/* Summary */}
              <dl className="mt-6 divide-y divide-line-1 border-t border-line-1">
                <div className="flex items-center justify-between gap-4 py-3">
                  <dt className="bo-label-sm">Amount</dt>
                  <dd className="bo-num text-sm font-medium text-ink">
                    {formatAmount(createdRequest.amount)}{" "}
                    <span className="text-teal">{createdRequest.currency}</span>
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4 py-3">
                  <dt className="bo-label-sm">Service</dt>
                  <dd className="min-w-0 truncate text-sm text-ink">
                    {createdRequest.description}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4 py-3">
                  <dt className="bo-label-sm">Stellar memo</dt>
                  <dd className="bo-code text-sm text-teal">{createdRequest.memo}</dd>
                </div>
              </dl>

              <Link
                href={paymentPageUrl}
                target="_blank"
                className="bo-btn bo-btn-ghost mt-6 w-full px-4 py-3 text-xs uppercase tracking-[0.1em]"
              >
                <span>Preview checkout screen</span>
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </div>
          ) : (
            <div className="relative border border-dashed border-line-2 bg-surface-1 p-12 text-center">
              <QrCode className="mx-auto h-10 w-10 text-ink-4" aria-hidden="true" />
              <h3 className="bo-heading mt-6 text-base font-medium text-ink">
                Your payment link and QR code appear here
              </h3>
              <p className="mx-auto mt-3 max-w-xs text-sm leading-relaxed text-ink-3">
                Fill in the details and generate the link to share with your client.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
