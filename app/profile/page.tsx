"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { usePollar } from "@pollar/react";
import { usePollarAuth } from "@/hooks/usePollarAuth";
import { useBalance } from "@/hooks/useBalance";
import {
  formatAmount,
  shortAddress,
  fundWithFriendbot,
  getUsdcIssuer,
} from "@/lib/stellar";
import { Mark, Corners, Eyebrow } from "@/components/blackout";
import {
  User,
  LogOut,
  Copy,
  Check,
  RefreshCw,
  QrCode,
  Loader2,
  AlertCircle,
  Plus,
  ArrowRight,
} from "lucide-react";

export default function ProfilePage() {
  const { runTx } = usePollar();
  const { user, isAuthenticated, login, logout } = usePollarAuth();
  const { balances, refresh, isLoading: balanceLoading } = useBalance();
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
    setTrustlineNotice(
      "Requesting wallet signature to establish USDC trustline on Stellar..."
    );
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
        setTrustlineNotice(
          "✓ USDC Trustline established! Your wallet can now receive USDC payments."
        );
        setTimeout(() => refresh(), 1500);
      } else if (outcome.status === "error") {
        setTrustlineNotice(
          outcome.details ||
            outcome.message ||
            "Failed to add trustline. Please ensure your account has a small XLM balance."
        );
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
      <div className="mx-auto flex max-w-md flex-1 flex-col items-center justify-center px-4 py-24 text-center">
        <span className="flex h-12 w-12 items-center justify-center border border-line-2 bg-surface-2">
          <User className="h-5 w-5 text-teal" aria-hidden="true" />
        </span>
        <h1 className="bo-display mt-7 text-3xl text-ink">Sign in to your profile</h1>
        <p className="mt-4 text-sm leading-relaxed text-ink-2">
          Manage your connected Pollar wallet, inspect asset trustlines, and configure your
          non-custodial receiving address.
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

  const usdcBalance = balances.find((b) => b.code === "USDC");
  const xlmBalance = balances.find((b) => b.code === "XLM" || b.type === "native");

  return (
    <div className="bo-rails mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="border-b border-line-2 pb-8">
        <Eyebrow>Identity &amp; security</Eyebrow>
        <h1 className="bo-display mt-5 text-3xl text-ink sm:text-4xl">Account &amp; wallet</h1>
        <p className="mt-3 text-sm text-ink-2">
          Your authenticated Pollar profile and Stellar non-custodial wallet settings.
        </p>
      </div>

      {/* Identity */}
      <section className="bo-panel relative mt-8 p-6 sm:p-8">
        <Corners />

        <div className="flex flex-col gap-5 border-b border-line-2 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <span className="bo-display flex h-14 w-14 shrink-0 items-center justify-center border border-line-2 bg-surface-3 text-xl text-teal">
              {user?.displayName?.charAt(0) || user?.email?.charAt(0) || "W"}
            </span>
            <div className="min-w-0">
              <h2 className="bo-heading truncate text-lg font-medium text-ink">
                {user?.displayName || "Independent Worker"}
              </h2>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                {user?.email && (
                  <span className="text-2xs text-ink-3">{user.email}</span>
                )}
                <span className="bo-chip bo-chip-ok">Pollar authenticated</span>
              </div>
            </div>
          </div>

          <button
            onClick={logout}
            className="bo-btn bo-btn-danger shrink-0 px-4 py-2.5 text-2xs uppercase tracking-[0.12em]"
          >
            <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Sign out</span>
          </button>
        </div>

        {/* Address */}
        <div className="mt-6">
          <div className="flex items-center justify-between gap-4">
            <span className="bo-label">Stellar receiving address</span>
            <button
              onClick={() => setShowQr(!showQr)}
              aria-expanded={showQr}
              className="inline-flex items-center gap-1.5 text-2xs font-medium uppercase tracking-[0.12em] text-teal hover:underline"
            >
              <QrCode className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{showQr ? "Hide QR" : "Show QR"}</span>
            </button>
          </div>

          <div className="mt-3 flex items-stretch gap-px bg-line-2">
            <div className="bo-code bo-panel-inset min-w-0 flex-1 select-all break-all p-3.5 text-xs text-ink">
              {user?.address}
            </div>
            <button
              onClick={handleCopyAddress}
              className="bo-btn bo-btn-secondary w-12 shrink-0"
              title="Copy address"
              aria-label="Copy Stellar address"
            >
              {copied ? (
                <Check className="h-4 w-4 text-teal" aria-hidden="true" />
              ) : (
                <Copy className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
          </div>
          <span aria-live="polite" className="mt-2 block text-2xs text-teal">
            {copied ? "Address copied to clipboard" : ""}
          </span>

          {showQr && user?.address && (
            <div className="bo-panel-inset bo-enter mt-4 flex flex-col items-center p-6">
              <div className="bg-white p-3">
                <QRCodeSVG value={user.address} size={148} level="M" />
              </div>
              <span className="bo-label-sm mt-4 text-center">
                Scan to transfer directly to this address
              </span>
            </div>
          )}
        </div>
      </section>

      {/* Assets */}
      <section className="mt-8">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Mark accent />
            <h2 className="bo-label text-ink">On-chain balances &amp; trustlines</h2>
          </div>
          <button
            onClick={() => refresh()}
            disabled={balanceLoading}
            className="inline-flex items-center gap-1.5 text-2xs font-medium uppercase tracking-[0.12em] text-teal hover:underline disabled:opacity-50"
          >
            <RefreshCw
              className={`h-3 w-3 ${balanceLoading ? "animate-spin" : ""}`}
              aria-hidden="true"
            />
            <span>Refresh</span>
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-px bg-line-2 sm:grid-cols-2">
          {/* USDC */}
          <div className="flex flex-col justify-between bg-surface-2 p-5">
            <div>
              <div className="flex items-start justify-between gap-3">
                <span className="bo-label-sm">USDC balance</span>
                {hasUsdcTrustline ? (
                  <span className="bo-chip bo-chip-ok">Trustline active</span>
                ) : (
                  <span className="bo-chip bo-chip-warn">Trustline needed</span>
                )}
              </div>
              <div className="bo-display bo-num mt-5 text-3xl text-ink">
                {usdcBalance ? formatAmount(usdcBalance.balance) : "0.00"}{" "}
                <span className="bo-label-sm text-sm text-teal">USDC</span>
              </div>
            </div>

            {!hasUsdcTrustline && (
              <button
                onClick={handleAddUsdcTrustline}
                disabled={addingTrustline}
                className="bo-btn bo-btn-primary mt-5 w-full px-3 py-2.5 text-2xs uppercase tracking-[0.12em]"
              >
                {addingTrustline ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                    <span>Adding trustline</span>
                  </>
                ) : (
                  <>
                    <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Add USDC trustline</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* XLM */}
          <div className="flex flex-col justify-between bg-surface-2 p-5">
            <div>
              <div className="flex items-start justify-between gap-3">
                <span className="bo-label-sm">Native XLM balance</span>
                <span className="bo-chip bo-chip-ok">Always ready</span>
              </div>
              <div className="bo-display bo-num mt-5 text-3xl text-ink">
                {xlmBalance ? formatAmount(xlmBalance.balance) : "0.00"}{" "}
                <span className="bo-label-sm text-sm text-gold">XLM</span>
              </div>
            </div>
            <p className="mt-5 border-t border-line-1 pt-3 text-2xs leading-relaxed text-ink-3">
              Native currency used for reserves and zero-fee transactions.
            </p>
          </div>
        </div>

        {trustlineNotice && (
          <div
            role="status"
            aria-live="polite"
            className="bo-note bo-note-info mt-4 p-4 text-xs leading-relaxed text-ink"
          >
            {trustlineNotice}
          </div>
        )}
      </section>

      {/* Faucet */}
      <section className="bo-panel mt-8 p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2.5">
              <Mark />
              <span className="bo-label text-gold">Testnet faucet</span>
            </div>
            <p className="mt-3 max-w-md text-xs leading-relaxed text-ink-2">
              Stellar Friendbot provides 10,000 testnet XLM to your Pollar address so you
              can simulate real payments and add trustlines.
            </p>
          </div>

          <button
            onClick={handleFundFriendbot}
            disabled={funding}
            className="bo-btn bo-btn-gold shrink-0 px-4 py-3 text-2xs uppercase tracking-[0.12em]"
          >
            {funding ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                <span>Funding</span>
              </>
            ) : (
              <>
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Get 10,000 XLM</span>
              </>
            )}
          </button>
        </div>

        {fundingMessage && (
          <div
            role="status"
            aria-live="polite"
            className="bo-note bo-note-warn mt-4 flex items-start gap-3 p-4"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden="true" />
            <span className="text-xs leading-relaxed text-ink">{fundingMessage}</span>
          </div>
        )}
      </section>

      <p className="mt-6 flex items-start gap-3 text-2xs leading-relaxed text-ink-3">
        <Mark />
        <span>
          Chamba never holds, stores or transmits your private keys. Signing happens inside
          Pollar; this interface only reads public ledger state.
        </span>
      </p>
    </div>
  );
}
