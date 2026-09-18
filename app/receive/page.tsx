"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { usePollarAuth } from "@/hooks/usePollarAuth";
import {
  savePaymentRequest,
  PaymentRequest,
  generateId,
} from "@/lib/storage";
import { shortAddress, formatAmount } from "@/lib/stellar";
import {
  PlusCircle,
  Copy,
  Check,
  ExternalLink,
  ArrowRight,
  Receipt,
  QrCode,
  AlertCircle,
  Sparkles,
} from "lucide-react";

export default function ReceivePaymentPage() {
  const router = useRouter();
  const { user, isAuthenticated, login } = usePollarAuth();

  const [amount, setAmount] = useState("50");
  const [currency, setCurrency] = useState<"USDC" | "XLM">("USDC");
  const [description, setDescription] = useState("Website Development");
  const [customerName, setCustomerName] = useState("");
  const [paymentReference, setPaymentReference] = useState("");

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

  if (!isAuthenticated) {
    return (
      <div className="mx-auto flex max-w-md flex-1 flex-col items-center justify-center px-4 py-20 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 mb-4">
          <Receipt className="h-7 w-7" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Sign In to Create Payment Requests
        </h1>
        <p className="mt-2 text-sm text-slate-600 leading-relaxed">
          Connect your Pollar wallet so incoming funds arrive directly into your non-custodial Stellar address.
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

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 w-full">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
          Receive Payment
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Create a branded payment request link. Once paid, a digital receipt is immediately issued.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Form Column */}
        <div className="lg:col-span-7">
          <form
            onSubmit={handleSubmit}
            className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs space-y-5"
          >
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-700 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Recipient Wallet Display */}
            <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-3 text-xs">
              <span className="text-slate-500 block mb-0.5">Your Pollar Receiving Wallet:</span>
              <span className="font-mono font-medium text-slate-800">
                {shortAddress(user?.address || "", 12, 10)}
              </span>
            </div>

            {/* Amount & Currency */}
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2 space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Amount
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    min="0.01"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="50.00"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-base font-semibold text-slate-900 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Currency
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as "USDC" | "XLM")}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-800 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                >
                  <option value="USDC">USDC</option>
                  <option value="XLM">XLM</option>
                </select>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Description / Service
              </label>
              <input
                type="text"
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Website Development, Haircut, Portrait Session"
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
              <span className="text-[11px] text-slate-400">
                This appears on the customer's checkout screen and digital receipt.
              </span>
            </div>

            {/* Optional Customer Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Customer / Client Name <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. Acme Corp or Jane Doe"
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
            </div>

            {/* Optional Reference */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Invoice Reference <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
                placeholder="e.g. INV-2026-001"
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3.5 text-base font-semibold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700 active:scale-[0.98] transition-all disabled:opacity-60"
            >
              <PlusCircle className="h-5 w-5" />
              <span>{isSubmitting ? "Generating Request..." : "Generate Payment Link"}</span>
            </button>
          </form>
        </div>

        {/* Generated Link & QR Column */}
        <div className="lg:col-span-5">
          {createdRequest ? (
            <div className="rounded-3xl border border-emerald-200 bg-white p-6 sm:p-7 shadow-lg space-y-6">
              <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
                <Sparkles className="h-4 w-4 text-emerald-600" />
                <span>Payment Request Ready!</span>
              </div>

              <div className="border-b border-slate-100 pb-4">
                <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
                  Payment Link
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <input
                    readOnly
                    value={paymentPageUrl}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 font-mono text-xs text-slate-700 select-all"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="shrink-0 rounded-lg bg-emerald-600 p-2 text-white hover:bg-emerald-700 active:scale-95 transition-all shadow-xs"
                    title="Copy Payment Link"
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
                {copied && (
                  <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">
                    ✓ Link copied to clipboard!
                  </span>
                )}
              </div>

              {/* QR Code */}
              <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-xs">
                  <QRCodeSVG value={paymentPageUrl} size={150} level="M" />
                </div>
                <span className="text-xs text-slate-500 font-medium mt-3">
                  Customers can scan this QR code on their phone
                </span>
              </div>

              {/* Request Summary */}
              <div className="space-y-2 text-xs border-t border-slate-100 pt-4">
                <div className="flex justify-between">
                  <span className="text-slate-500">Amount:</span>
                  <span className="font-bold text-slate-900">
                    {formatAmount(createdRequest.amount)} {createdRequest.currency}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Service:</span>
                  <span className="text-slate-800 font-medium">{createdRequest.description}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Stellar Memo:</span>
                  <span className="font-mono text-slate-700">{createdRequest.memo}</span>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  href={paymentPageUrl}
                  target="_blank"
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-600 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-100/70 transition-all"
                >
                  <span>Open Customer Payment Page</span>
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </div>
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center text-slate-400">
              <QrCode className="h-10 w-10 mx-auto text-slate-300 mb-3" />
              <h3 className="text-sm font-semibold text-slate-600">
                Your payment link and QR code will appear here
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                Fill out the payment details on the left and click "Generate Payment Link".
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
