"use client";

import { useState } from "react";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { usePollarAuth } from "@/hooks/usePollarAuth";
import { useBalance } from "@/hooks/useBalance";
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
  Receipt,
  QrCode,
  AlertCircle,
  Sparkles,
  Share2,
  CheckCircle2,
  Send,
  Info,
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
      <div className="mx-auto flex max-w-md flex-1 flex-col items-center justify-center px-4 py-20 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#075E54]/10 text-[#075E54] mb-6">
          <Receipt className="h-8 w-8 text-[#075E54]" />
        </div>
        <h1 className="font-heading text-3xl font-black tracking-tight text-[#102A2A]">
          Sign In to Create Payment Requests
        </h1>
        <p className="mt-3 text-sm text-[#5F6F6D] leading-relaxed">
          Connect your Pollar wallet so incoming customer payments arrive directly into your non-custodial Stellar address.
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

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 w-full">
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 text-xs font-bold text-[#075E54] uppercase tracking-wider mb-1.5">
          <span className="h-2 w-2 rounded-full bg-[#16A085]" />
          Dignified Invoicing
        </div>
        <h1 className="font-heading text-3xl sm:text-4xl font-black tracking-tight text-[#102A2A]">
          Get paid for your work.
        </h1>
        <p className="text-sm sm:text-base text-[#5F6F6D] mt-1.5 font-normal">
          Create a clear payment request and send it to your customer. Once paid, a digital receipt is immediately issued.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Form Column */}
        <div className="lg:col-span-7">
          <form
            onSubmit={handleSubmit}
            className="rounded-3xl border border-[#075E54]/15 bg-white p-6 sm:p-8 shadow-sm space-y-5"
          >
            {error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs text-red-700 flex items-start gap-2.5">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Recipient Wallet Display */}
            <div className="rounded-2xl border border-[#075E54]/15 bg-[#F8F7F2] p-3.5 text-xs">
              <span className="text-[#5F6F6D] block mb-0.5 font-medium">Your Pollar Receiving Wallet:</span>
              <span className="font-mono font-bold text-[#102A2A]">
                {shortAddress(user?.address || "", 12, 10)}
              </span>
            </div>

            {/* Amount & Currency */}
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2 space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-[#102A2A]">
                  Amount
                </label>
                <input
                  type="number"
                  step="any"
                  min="0.01"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="50.00"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-base font-bold text-[#102A2A] focus:border-[#075E54] focus:outline-none focus:ring-2 focus:ring-[#075E54]/20 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-[#102A2A]">
                  Currency
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as "USDC" | "XLM")}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-bold text-[#102A2A] focus:border-[#075E54] focus:outline-none focus:ring-2 focus:ring-[#075E54]/20 transition-all cursor-pointer"
                >
                  <option value="USDC">USDC</option>
                  <option value="XLM">XLM</option>
                </select>
              </div>
            </div>

            {/* USDC Trustline Notice */}
            {currency === "USDC" && !hasUsdcTrustline && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-3.5 text-xs text-amber-900 flex items-start gap-2.5">
                <Info className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                <div className="leading-relaxed">
                  <span className="font-bold">Stellar Trustline Notice:</span> To receive USDC, your Stellar wallet must establish a USDC trustline. You can add it in 1 click from your{" "}
                  <Link href="/profile" className="underline font-bold text-amber-950">
                    Profile
                  </Link>
                  , or switch this request to{" "}
                  <button
                    type="button"
                    onClick={() => setCurrency("XLM")}
                    className="underline font-bold text-amber-950 cursor-pointer"
                  >
                    XLM
                  </button>{" "}
                  (which requires no trustline).
                </div>
              </div>
            )}

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-[#102A2A]">
                Description / Service
              </label>
              <input
                type="text"
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Website Development, Tailored Kaftan, Photography"
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-[#102A2A] focus:border-[#075E54] focus:outline-none focus:ring-2 focus:ring-[#075E54]/20 transition-all"
              />
              <span className="text-[11px] text-[#5F6F6D] block">
                This appears on your customer's checkout screen and digital proof of income.
              </span>
            </div>

            {/* Optional Customer Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-[#102A2A]">
                Customer / Client Name <span className="text-[#5F6F6D] font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. Acme Studio or Kemi Adeleke"
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-[#102A2A] focus:border-[#075E54] focus:outline-none focus:ring-2 focus:ring-[#075E54]/20 transition-all"
              />
            </div>

            {/* Optional Reference */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-[#102A2A]">
                Invoice Reference <span className="text-[#5F6F6D] font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
                placeholder="e.g. INV-2026-001"
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-[#102A2A] focus:border-[#075E54] focus:outline-none focus:ring-2 focus:ring-[#075E54]/20 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#075E54] px-6 py-4 text-base font-bold text-white shadow-lg shadow-[#075E54]/20 hover:bg-[#064e46] active:scale-[0.98] transition-all disabled:opacity-60 cursor-pointer"
            >
              <PlusCircle className="h-5 w-5" />
              <span>{isSubmitting ? "Generating Request..." : "Generate Payment Link"}</span>
            </button>
          </form>
        </div>

        {/* Generated Link & QR Column */}
        <div className="lg:col-span-5">
          {createdRequest ? (
            <div className="rounded-3xl border border-[#075E54]/25 bg-white p-6 sm:p-7 shadow-xl space-y-6 animate-in zoom-in-95 duration-200">
              <div className="flex items-center gap-2 text-[#075E54] font-black font-heading text-base">
                <Sparkles className="h-5 w-5 text-[#F2A900]" />
                <span>Payment Request Ready!</span>
              </div>

              {/* Action Buttons: WhatsApp & Copy */}
              <div className="space-y-3">
                <a
                  href={buildWhatsAppShareUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2.5 rounded-xl bg-[#16A085] px-4 py-3 text-sm font-bold text-white shadow-md shadow-[#16A085]/20 hover:bg-[#138d75] transition-all"
                >
                  <Share2 className="h-4 w-4" />
                  <span>Share via WhatsApp</span>
                </a>

                <div className="flex items-center gap-2">
                  <input
                    readOnly
                    value={paymentPageUrl}
                    className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-[#F8F7F2] px-3 py-2.5 font-mono text-xs text-[#102A2A] select-all focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="shrink-0 min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl bg-[#075E54] text-white hover:bg-[#064e46] active:scale-95 transition-all cursor-pointer shadow-2xs"
                    title="Copy Payment Link"
                    aria-label="Copy Payment Link"
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
                {copied && (
                  <span className="text-xs text-[#075E54] font-semibold block text-center">
                    ✓ Link copied to clipboard!
                  </span>
                )}
              </div>

              {/* QR Code */}
              <div className="flex flex-col items-center justify-center p-5 bg-[#F8F7F2] rounded-2xl border border-[#075E54]/10">
                <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm">
                  <QRCodeSVG value={paymentPageUrl} size={160} level="M" />
                </div>
                <span className="text-xs text-[#5F6F6D] font-medium mt-3 text-center">
                  Point client camera here to pay with Pollar
                </span>
              </div>

              {/* Request Summary */}
              <div className="space-y-2 text-xs border-t border-slate-100 pt-4">
                <div className="flex justify-between">
                  <span className="text-[#5F6F6D]">Amount:</span>
                  <span className="font-heading font-black text-[#102A2A] text-sm">
                    {formatAmount(createdRequest.amount)} {createdRequest.currency}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5F6F6D]">Service:</span>
                  <span className="text-[#102A2A] font-semibold">{createdRequest.description}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5F6F6D]">Stellar Memo:</span>
                  <span className="font-mono text-[#075E54] font-bold">{createdRequest.memo}</span>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  href={paymentPageUrl}
                  target="_blank"
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-[#075E54]/30 bg-[#075E54]/5 px-4 py-3 text-sm font-bold text-[#075E54] hover:bg-[#075E54]/10 transition-all"
                >
                  <span>Preview Customer Checkout Screen</span>
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </div>
            </div>
          ) : (
            <div className="rounded-3xl border-2 border-dashed border-[#075E54]/20 bg-white/60 p-10 text-center text-[#5F6F6D]">
              <QrCode className="h-12 w-12 mx-auto text-[#075E54]/40 mb-3" />
              <h3 className="font-heading text-base font-bold text-[#102A2A]">
                Your payment link and QR code will appear here
              </h3>
              <p className="text-xs text-[#5F6F6D] mt-1.5 max-w-xs mx-auto leading-relaxed">
                Fill in the details on the left and click &ldquo;Generate Payment Link&rdquo; to share with your client.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
