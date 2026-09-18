"use client";

import { useState } from "react";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { usePollar } from "@pollar/react";
import { usePollarAuth } from "@/hooks/usePollarAuth";
import { useBalance } from "@/hooks/useBalance";
import { formatAmount, shortAddress, fundWithFriendbot, getUsdcIssuer } from "@/lib/stellar";
import {
  User,
  Wallet,
  LogOut,
  Copy,
  Check,
  ShieldCheck,
  Globe,
  RefreshCw,
  QrCode,
  ArrowRight,
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Plus,
} from "lucide-react";

export default function ProfilePage() {
  const { runTx } = usePollar();
  const { user, isAuthenticated, login, logout, verified } = usePollarAuth();
  const { balance, currency, balances, refresh, isLoading: balanceLoading } = useBalance();
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [funding, setFunding] = useState(false);
  const [fundingMessage, setFundingMessage] = useState<string | null>(null);
  const [addingTrustline, setAddingTrustline] = useState(false);
  const [trustlineNotice, setTrustlineNotice] = useState<string | null>(null);

  const hasUsdcTrustline = balances.some((b) => b.code === "USDC");

  const handleFundFriendbot = async () => {
    if (!user?.address) return;
    setFunding(true);
    setFundingMessage("Requesting 10,000 testnet XLM from Stellar Friendbot...");
    const res = await fundWithFriendbot(user.address);
    setFunding(false);
    if (res.ok) {
      setFundingMessage("✓ " + res.message);
      setTimeout(() => refresh(), 1500);
    } else {
      setFundingMessage(`Friendbot notice: ${res.message}`);
    }
  };

  const handleAddUsdcTrustline = async () => {
    if (!user?.address) return;
    setAddingTrustline(true);
    setTrustlineNotice("Requesting wallet signature to establish USDC trustline on Stellar...");
    try {
      const outcome = await runTx("change_trust", {
        asset: {
          type: "credit_alphanum4",
          code: "USDC",
          issuer: getUsdcIssuer(),
        },
      });
      setAddingTrustline(false);
      if (outcome.status === "success") {
        setTrustlineNotice("✓ USDC Trustline established! Your wallet can now receive USDC payments.");
        setTimeout(() => refresh(), 1500);
      } else if (outcome.status === "error") {
        setTrustlineNotice(outcome.details || outcome.message || "Failed to add trustline. Please ensure your account has a small XLM balance.");
      } else {
        setTrustlineNotice("Trustline transaction submitted to Stellar.");
      }
    } catch (err: unknown) {
      setAddingTrustline(false);
      const msg = err instanceof Error ? err.message : String(err);
      setTrustlineNotice(`Trustline error: ${msg}`);
    }
  };

  const handleCopyAddress = async () => {
    if (!user?.address) return;
    try {
      await navigator.clipboard.writeText(user.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="mx-auto flex max-w-md flex-1 flex-col items-center justify-center px-4 py-20 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#075E54]/10 text-[#075E54] mb-6">
          <User className="h-8 w-8 text-[#075E54]" />
        </div>
        <h1 className="font-heading text-3xl font-black tracking-tight text-[#102A2A]">
          Sign In to Your Profile
        </h1>
        <p className="mt-3 text-sm text-[#5F6F6D] leading-relaxed">
          Manage your connected Pollar wallet, inspect asset trustlines, and configure your non-custodial receiving address.
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
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8 w-full space-y-6">
      <div className="border-b border-[#075E54]/10 pb-5">
        <div className="inline-flex items-center gap-2 text-xs font-bold text-[#075E54] uppercase tracking-wider mb-1.5">
          <span className="h-2 w-2 rounded-full bg-[#16A085]" />
          Identity & Security
        </div>
        <h1 className="font-heading text-3xl sm:text-4xl font-black tracking-tight text-[#102A2A]">
          Account & Wallet
        </h1>
        <p className="text-sm text-[#5F6F6D] mt-1">
          Your authenticated Pollar profile and Stellar non-custodial wallet settings.
        </p>
      </div>

      {/* Profile Card */}
      <div className="rounded-3xl border border-[#075E54]/15 bg-white p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#075E54] text-[#F2A900] text-2xl font-black shadow-sm font-heading">
              {user?.displayName?.charAt(0) || user?.email?.charAt(0) || "W"}
            </div>
            <div>
              <h2 className="font-heading text-xl font-bold text-[#102A2A]">
                {user?.displayName || "Independent Worker"}
              </h2>
              <div className="flex items-center gap-2 text-xs text-[#5F6F6D] mt-0.5">
                {user?.email && <span>{user.email}</span>}
                {user?.email && <span>&bull;</span>}
                <span className="inline-flex items-center gap-1 text-[#075E54] font-semibold">
                  <ShieldCheck className="h-3.5 w-3.5 text-[#16A085]" />
                  Pollar Authenticated
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={logout}
            className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50/50 px-4 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 transition-colors cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign Out</span>
          </button>
        </div>

        {/* Public Address */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-[#5F6F6D]">
              Stellar Receiving Address (Non-Custodial)
            </label>
            <button
              onClick={() => setShowQr(!showQr)}
              className="text-xs font-bold text-[#075E54] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <QrCode className="h-3.5 w-3.5" />
              <span>{showQr ? "Hide QR" : "Show QR"}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex-1 rounded-xl border border-slate-200 bg-[#F8F7F2] p-3 font-mono text-xs text-[#102A2A] break-all select-all font-semibold">
              {user?.address}
            </div>
            <button
              onClick={handleCopyAddress}
              className="rounded-xl border border-[#075E54]/20 bg-white p-3 text-[#075E54] hover:bg-[#F8F7F2] active:scale-95 transition-all shadow-2xs cursor-pointer"
              title="Copy Address"
            >
              {copied ? <Check className="h-4 w-4 text-[#075E54]" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>

          {showQr && user?.address && (
            <div className="p-4 bg-[#F8F7F2] rounded-2xl border border-[#075E54]/10 flex flex-col items-center justify-center pt-5">
              <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm">
                <QRCodeSVG value={user.address} size={150} level="M" />
              </div>
              <span className="text-2xs text-[#5F6F6D] font-medium mt-2">
                Scan to transfer directly to this Stellar address
              </span>
            </div>
          )}
        </div>

        {/* Real-time Balances & Trustline Management */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-[#5F6F6D]">
              Verified On-Chain Balances & Trustlines
            </label>
            <button
              onClick={() => refresh()}
              disabled={balanceLoading}
              className="text-xs font-bold text-[#075E54] hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`h-3 w-3 ${balanceLoading ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* USDC Balance Card with Trustline Status */}
            <div className="rounded-2xl border border-[#075E54]/15 bg-white p-4 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-2xs font-bold uppercase text-[#5F6F6D]">USDC Balance</span>
                  {hasUsdcTrustline ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#16A085] bg-[#16A085]/10 px-2 py-0.5 rounded-full border border-[#16A085]/20">
                      <CheckCircle2 className="h-3 w-3" />
                      Trustline Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                      <AlertCircle className="h-3 w-3" />
                      Trustline Needed
                    </span>
                  )}
                </div>
                <div className="font-heading text-2xl font-black text-[#102A2A] mt-1">
                  {balances.find((b) => b.code === "USDC")
                    ? formatAmount(balances.find((b) => b.code === "USDC")!.balance)
                    : "0.00"}{" "}
                  <span className="text-sm font-bold text-[#075E54]">USDC</span>
                </div>
              </div>

              {!hasUsdcTrustline && (
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <button
                    onClick={handleAddUsdcTrustline}
                    disabled={addingTrustline}
                    className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#075E54] px-3 py-2 text-xs font-bold text-white shadow-2xs hover:bg-[#064e46] active:scale-95 transition-all disabled:opacity-60 cursor-pointer"
                  >
                    {addingTrustline ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Adding Trustline...</span>
                      </>
                    ) : (
                      <>
                        <Plus className="h-3.5 w-3.5 text-[#F2A900]" />
                        <span>Add USDC Trustline</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Native XLM Balance */}
            <div className="rounded-2xl border border-[#075E54]/15 bg-white p-4 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-2xs font-bold uppercase text-[#5F6F6D]">Native XLM Balance</span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#16A085] bg-[#16A085]/10 px-2 py-0.5 rounded-full border border-[#16A085]/20">
                    <CheckCircle2 className="h-3 w-3" />
                    Always Ready
                  </span>
                </div>
                <div className="font-heading text-2xl font-black text-[#102A2A] mt-1">
                  {balances.find((b) => b.code === "XLM" || b.type === "native")
                    ? formatAmount(balances.find((b) => b.code === "XLM" || b.type === "native")!.balance)
                    : "0.00"}{" "}
                  <span className="text-sm font-bold text-[#b37d00]">XLM</span>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 text-2xs text-[#5F6F6D]">
                Native currency used for reserves and zero-fee transactions.
              </div>
            </div>
          </div>

          {trustlineNotice && (
            <div className="rounded-xl border border-[#075E54]/20 bg-[#075E54]/5 p-3 text-xs font-semibold text-[#102A2A]">
              {trustlineNotice}
            </div>
          )}
        </div>

        {/* Stellar Testnet Faucet Trigger */}
        <div className="rounded-2xl border border-[#F2A900]/30 bg-[#F2A900]/10 p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="font-heading font-bold text-[#102A2A] text-sm">
                Need Testnet Stellar Funds?
              </div>
              <p className="text-2xs text-[#5F6F6D] mt-0.5 leading-relaxed">
                Stellar Friendbot provides 10,000 testnet XLM directly to your Pollar address so you can simulate real payments and add trustlines.
              </p>
            </div>

            <button
              onClick={handleFundFriendbot}
              disabled={funding}
              className="shrink-0 inline-flex items-center gap-1.5 rounded-xl border border-[#F2A900]/40 bg-white px-4 py-2 text-xs font-bold text-[#b37d00] shadow-2xs hover:bg-white/80 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
            >
              {funding ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Funding...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5 text-[#F2A900]" />
                  <span>Get 10,000 Testnet XLM</span>
                </>
              )}
            </button>
          </div>

          {fundingMessage && (
            <div className="mt-3 rounded-xl bg-white p-3 text-xs font-semibold text-[#102A2A] border border-[#F2A900]/30">
              {fundingMessage}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
