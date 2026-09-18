"use client";

import { useState } from "react";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { usePollarAuth } from "@/hooks/usePollarAuth";
import { useBalance } from "@/hooks/useBalance";
import { formatAmount, shortAddress, fundWithFriendbot } from "@/lib/stellar";
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
} from "lucide-react";

export default function ProfilePage() {
  const { user, isAuthenticated, login, logout, verified } = usePollarAuth();
  const { balance, currency, balances, refresh, isLoading: balanceLoading } = useBalance();
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [funding, setFunding] = useState(false);
  const [fundingMessage, setFundingMessage] = useState<string | null>(null);

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
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 mb-4">
          <User className="h-7 w-7" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Sign In to Your Profile
        </h1>
        <p className="mt-2 text-sm text-slate-600 leading-relaxed">
          Manage your connected Pollar wallet, inspect asset trustlines, and configure your freelance receiving address.
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
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8 w-full space-y-6">
      <div className="border-b border-slate-200/80 pb-5">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
          Account & Wallet
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Your authenticated Pollar profile and Stellar non-custodial wallet settings.
        </p>
      </div>

      {/* Profile Card */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white text-2xl font-bold shadow-sm">
              {user?.displayName?.charAt(0) || user?.email?.charAt(0) || "W"}
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                {user?.displayName || "Independent Worker"}
              </h2>
              <p className="text-sm text-slate-500">{user?.email || "Connected with Pollar"}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                  <ShieldCheck className="h-3 w-3" />
                  {verified ? "Verified Session" : "Optimistic"}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 border border-blue-200">
                  <Globe className="h-3 w-3" />
                  Stellar Testnet
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={logout}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50/50 px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign Out</span>
          </button>
        </div>

        {/* Stellar Receiving Address */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
            <span>Stellar Address (G-Address)</span>
            <button
              onClick={() => setShowQr(!showQr)}
              className="text-emerald-600 hover:text-emerald-700 lowercase font-medium flex items-center gap-1"
            >
              <QrCode className="h-3.5 w-3.5" />
              <span>{showQr ? "Hide QR" : "Show QR Code"}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <input
              readOnly
              value={user?.address}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 font-mono text-xs text-slate-800 select-all"
            />
            <button
              onClick={handleCopyAddress}
              className="shrink-0 rounded-xl bg-slate-900 p-2.5 text-white hover:bg-slate-800 transition-all shadow-xs"
              title="Copy Address"
            >
              {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>

          {showQr && (
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-center justify-center mt-3">
              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
                <QRCodeSVG value={user?.address || ""} size={160} level="M" />
              </div>
              <span className="text-xs text-slate-500 mt-2 font-medium">Scan to send funds directly</span>
            </div>
          )}
        </div>

        {/* Wallet Balances Section */}
        <div className="border-t border-slate-100 pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Wallet className="h-4 w-4 text-emerald-600" />
              <span>Wallet Balances</span>
            </h3>
            <button
              onClick={() => refresh()}
              disabled={balanceLoading}
              className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${balanceLoading ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
              <span className="text-xs text-slate-500 block">Primary USDC Balance</span>
              <div className="text-2xl font-extrabold text-slate-900 mt-1">
                {formatAmount(balance)} <span className="text-sm font-bold text-emerald-600">USDC</span>
              </div>
            </div>

            {balances
              .filter((b) => b.type === "native")
              .map((b) => (
                <div key={b.code} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                  <span className="text-xs text-slate-500 block">Native Stellar Asset</span>
                  <div className="text-2xl font-extrabold text-slate-900 mt-1">
                    {formatAmount(b.balance)} <span className="text-sm font-bold text-slate-600">XLM</span>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Testnet Friendbot Faucet */}
        <div className="border-t border-slate-100 pt-6">
          <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-blue-600" />
                  <span>Stellar Testnet Friendbot Faucet</span>
                </h4>
                <p className="text-xs text-slate-600 mt-0.5">
                  Need testnet funds? Request 10,000 free testnet XLM directly from the official Stellar network faucet.
                </p>
              </div>
              <button
                onClick={handleFundFriendbot}
                disabled={funding}
                className="shrink-0 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50"
              >
                {funding ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Funding Account...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Fund with 10,000 XLM</span>
                  </>
                )}
              </button>
            </div>
            {fundingMessage && (
              <div className="mt-3 rounded-lg bg-white p-3 text-xs font-medium text-slate-800 border border-blue-200">
                {fundingMessage}
              </div>
            )}
          </div>
        </div>

        {/* Quick link to Receive Payment */}
        <div className="border-t border-slate-100 pt-6">
          <Link
            href="/receive"
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3.5 text-sm font-semibold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700 active:scale-[0.98] transition-all"
          >
            <span>Create a Payment Request</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
