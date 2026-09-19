"use client";

import { useEffect, useState, use, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import confetti from "canvas-confetti";
import { usePollar } from "@pollar/react";
import { usePollarAuth } from "@/hooks/usePollarAuth";
import {
  getPaymentRequest,
  savePaymentRecord,
  savePaymentRequest,
  updatePaymentRequestStatus,
  PaymentRequest,
  PaymentRecord,
  generateId,
} from "@/lib/storage";
import {
  formatAmount,
  shortAddress,
  getPaymentAsset,
  verifyPaymentOnHorizon,
  looksLikeAddress,
  fundWithFriendbot,
} from "@/lib/stellar";
import { Mark, Corners } from "@/components/blackout";
import { ChambaMark } from "@/components/ChambaMark";
import {
  CheckCircle2,
  AlertCircle,
  Wallet,
  ShieldCheck,
  ArrowRight,
  Loader2,
  Plus,
} from "lucide-react";

function PaymentCheckoutContent({ requestId }: { requestId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const { runTx, openLoginModal } = usePollar();
  const { user, isAuthenticated, isLoading: isAuthLoading } = usePollarAuth();

  const [request, setRequest] = useState<PaymentRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [funding, setFunding] = useState(false);
  const [fundingMessage, setFundingMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirmedReceiptId, setConfirmedReceiptId] = useState<string | null>(null);

  const handleFundFriendbot = async () => {
    if (!user?.address) return;
    setFunding(true);
    setFundingMessage("Requesting 10,000 testnet XLM from Stellar Friendbot...");
    const res = await fundWithFriendbot(user.address);
    setFunding(false);
    if (res.ok) {
      setFundingMessage("✓ Wallet funded with 10,000 testnet XLM on Stellar!");
      setErrorMessage(null);
    } else {
      setFundingMessage(`Friendbot notice: ${res.message}`);
    }
  };

  useEffect(() => {
    let r = getPaymentRequest(requestId);

    // If not found in localStorage (e.g. opened on client phone/laptop),
    // hydrate statelessly from URL query parameters:
    if (!r && searchParams) {
      const to = searchParams.get("to");
      const amt = searchParams.get("amt");
      const cur = searchParams.get("cur") as "USDC" | "XLM" | null;
      const memo = searchParams.get("memo") || `CR-${requestId.slice(-6)}`;
      const desc = searchParams.get("desc") || "Payment for Services";
      const worker = searchParams.get("worker") || undefined;
      const customer = searchParams.get("customer") || undefined;

      if (to && looksLikeAddress(to) && amt && !isNaN(Number(amt)) && Number(amt) > 0) {
        r = {
          id: requestId,
          workerAddress: to,
          workerName: worker,
          customerName: customer,
          description: desc,
          amount: amt,
          currency: cur === "XLM" ? "XLM" : "USDC",
          memo: memo,
          status: "pending",
          createdAt: new Date().toISOString(),
        };
        // Persist on customer's device so subsequent actions and receipts track it
        savePaymentRequest(r);
      }
    }

    setRequest(r);
    if (r?.confirmedPaymentId) {
      setConfirmedReceiptId(r.confirmedPaymentId);
    }
    setLoading(false);
  }, [requestId, searchParams]);

  const handlePay = async () => {
    if (!request) return;
    if (!isAuthenticated || !user?.address) {
      openLoginModal();
      return;
    }

    setPaying(true);
    setErrorMessage(null);
    setStatusMessage("Preparing transaction on Stellar network...");

    try {
      // 1. Prepare payment asset
      const assetParam = getPaymentAsset(request.currency);

      setStatusMessage("Please sign the payment in your Pollar wallet...");

      // 2. Execute real Pollar transaction via runTx (build -> sign -> submit)
      const outcome = await runTx(
        "payment",
        {
          destination: request.workerAddress,
          amount: request.amount,
          asset: assetParam,
        },
        {
          memo: {
            type: "text",
            value: request.memo,
          },
        }
      );

      if (outcome.status === "error") {
        setPaying(false);
        setStatusMessage(null);
        const rawErr = outcome.details || outcome.message || "";
        if (/trustline|no trustline|op_no_trust/i.test(rawErr)) {
          setErrorMessage(
            "The recipient's wallet has not opened a USDC trustline yet. On Stellar, accounts must enable trustlines to receive non-native assets. The recipient can add the USDC trustline in their Chamba Profile, or create a payment link in XLM (which requires no trustline)."
          );
        } else {
          setErrorMessage(
            rawErr ||
              "The payment was rejected or failed. Please check your wallet and try again."
          );
        }
        return;
      }

      const txHash = outcome.hash;
      setStatusMessage("Payment submitted! Awaiting Stellar ledger consensus...");

      // 3. Confirm on Horizon with Exponential Backoff
      const delays = [1500, 2500, 4000, 6000];
      let verifiedResult = await verifyPaymentOnHorizon({
        hash: txHash,
        destination: request.workerAddress,
        amount: request.amount,
        expectedMemo: request.memo,
        currency: request.currency,
      });

      for (let attempt = 0; !verifiedResult.ok && attempt < delays.length; attempt++) {
        setStatusMessage(
          `Waiting for Stellar consensus (attempt ${attempt + 1}/${delays.length + 1})...`
        );
        await new Promise((res) => setTimeout(res, delays[attempt]));
        verifiedResult = await verifyPaymentOnHorizon({
          hash: txHash,
          destination: request.workerAddress,
          amount: request.amount,
          expectedMemo: request.memo,
          currency: request.currency,
        });
      }

      // 4. Create Confirmed Payment Record
      const receiptId = generateId("CR");
      const confirmedRecord: PaymentRecord = {
        id: receiptId,
        paymentRequestId: request.id,
        transactionId: txHash,
        workerAddress: request.workerAddress,
        workerName: request.workerName,
        payerAddress: verifiedResult.payerAddress || user.address,
        payerName: user.displayName || user.email || "Pollar Customer",
        description: request.description,
        amount: request.amount,
        currency: request.currency,
        status: "successful",
        memo: request.memo,
        createdAt: new Date().toISOString(),
        paidAt: new Date().toISOString(),
      };

      savePaymentRecord(confirmedRecord);
      updatePaymentRequestStatus(request.id, "successful", receiptId);
      setConfirmedReceiptId(receiptId);
      setPaying(false);
      setStatusMessage(null);

      // Celebrate with confetti
      try {
        confetti({
          particleCount: 90,
          spread: 75,
          origin: { y: 0.6 },
          colors: ["#2CC5A0", "#F2A900", "#46D5D0", "#FFFFFF"],
        });
      } catch {
        // ignore
      }

      // Auto-redirect to verified receipt with txHash in query parameter
      setTimeout(() => {
        router.push(`/receipt/${receiptId}?tx=${txHash}`);
      }, 1800);
    } catch (err: unknown) {
      setPaying(false);
      setStatusMessage(null);
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(`Payment error: ${msg}`);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center p-16">
        <Loader2 className="h-6 w-6 animate-spin text-teal" aria-label="Loading" />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="mx-auto flex max-w-md flex-1 flex-col items-center justify-center px-4 py-24 text-center">
        <span className="flex h-12 w-12 items-center justify-center border border-line-2 bg-surface-2">
          <AlertCircle className="h-5 w-5 text-coral" aria-hidden="true" />
        </span>
        <h1 className="bo-display mt-7 text-2xl text-ink">Payment request not found</h1>
        <p className="mt-4 text-sm leading-relaxed text-ink-3">
          The payment link you visited may be invalid, expired, or missing its query
          parameters.
        </p>
        <Link
          href="/"
          className="bo-btn bo-btn-ghost mt-8 px-5 py-3 text-xs uppercase tracking-[0.1em]"
        >
          Go to Chamba Receipts
        </Link>
      </div>
    );
  }

  // If already confirmed paid:
  if (confirmedReceiptId) {
    return (
      <div className="mx-auto w-full max-w-md px-4 py-14">
        <div className="bo-panel-live bo-enter relative p-8 text-center">
          <Corners accent />

          <span className="mx-auto flex h-14 w-14 items-center justify-center border border-teal/40 bg-teal/10">
            <CheckCircle2 className="h-7 w-7 text-teal" aria-hidden="true" />
          </span>

          <span className="bo-chip bo-chip-ok mt-6">Payment complete &middot; verified</span>

          <h1 className="bo-display mt-5 text-2xl text-ink sm:text-3xl">
            Payment received. Another win.
          </h1>
          <p className="mt-3 text-sm font-medium text-teal">Your hard work just paid off.</p>

          <div className="bo-panel-inset mt-6 px-4 py-5">
            <div className="bo-display bo-num text-3xl text-ink">
              {formatAmount(request.amount)}{" "}
              <span className="bo-label-sm text-sm text-teal">{request.currency}</span>
            </div>
            <p className="mt-2 text-xs text-ink-2">{request.description}</p>
          </div>

          <p className="mt-5 text-2xs leading-relaxed text-ink-3">
            Confirmed on the Stellar ledger. Your immutable digital proof of income has
            been issued.
          </p>

          <Link
            href={`/receipt/${confirmedReceiptId}`}
            className="bo-btn bo-btn-primary mt-7 w-full px-6 py-4 text-xs uppercase tracking-[0.12em]"
          >
            <span>View digital receipt</span>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-md px-4 py-8 sm:py-14">
      <div className="bo-panel relative p-5 sm:p-7">
        <Corners />

        {/* Header */}
        <header className="flex items-center justify-between gap-4 border-b border-line-2 pb-5">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center border border-line-2 bg-surface-3">
              <ChambaMark className="h-5 w-5 text-teal" />
            </span>
            <div>
              <span className="bo-heading block text-xs font-semibold uppercase tracking-[0.2em] text-ink">
                Chamba Checkout
              </span>
              <span className="bo-label-sm mt-1.5 block">Simple &middot; non-custodial</span>
            </div>
          </div>
          <span className="bo-chip bo-chip-ok shrink-0">
            <span className="bo-pulse" aria-hidden="true" />
            Pollar
          </span>
        </header>

        {/* Payee & amount */}
        <div className="border-b border-line-2 py-6 text-center">
          <div className="bo-label-sm">Paying directly to</div>
          <div className="bo-heading mt-2.5 truncate text-lg font-medium text-ink">
            {request.workerName || "Independent Worker"}
          </div>
          <div className="bo-code mt-1.5 text-2xs text-ink-3">
            {shortAddress(request.workerAddress, 8, 8)}
          </div>

          <div className="bo-panel-inset mt-6 px-4 py-6">
            <div className="bo-display bo-num text-4xl text-ink">
              {formatAmount(request.amount)}
            </div>
            <div className="bo-label mt-2 text-teal tracking-[0.2em]">
              {request.currency}
            </div>
            <p className="mt-4 break-words text-xs leading-relaxed text-ink-2">
              {request.description}
            </p>
          </div>
        </div>

        {/* Ledger parameters */}
        <dl className="divide-y divide-line-1 border-b border-line-2">
          <div className="flex items-center justify-between gap-4 py-3">
            <dt className="bo-label-sm">Memo ID</dt>
            <dd className="bo-code truncate text-xs text-teal">{request.memo}</dd>
          </div>
          {request.customerName && (
            <div className="flex items-center justify-between gap-4 py-3">
              <dt className="bo-label-sm">Billed to</dt>
              <dd className="truncate text-xs text-ink">{request.customerName}</dd>
            </div>
          )}
          <div className="flex items-center justify-between gap-4 py-3">
            <dt className="bo-label-sm">Network</dt>
            <dd className="text-xs text-ink">Stellar Testnet</dd>
          </div>
          <div className="flex items-center justify-between gap-4 py-3">
            <dt className="bo-label-sm">Custody</dt>
            <dd className="flex items-center gap-2 text-xs text-teal">
              <Mark accent />
              Non-custodial direct
            </dd>
          </div>
        </dl>

        {/* Status */}
        <div aria-live="polite" aria-atomic="true">
          {statusMessage && (
            <div className="bo-note bo-note-info mt-5 flex items-center gap-3 p-3.5">
              <Loader2 className="h-4 w-4 shrink-0 animate-spin text-aqua" aria-hidden="true" />
              <span className="text-xs font-medium text-ink">{statusMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div
              role="alert"
              className="bo-note bo-note-error mt-5 flex items-start gap-3 p-3.5"
            >
              <AlertCircle
                className="mt-0.5 h-4 w-4 shrink-0 text-coral"
                aria-hidden="true"
              />
              <span className="text-xs leading-relaxed text-ink-2">{errorMessage}</span>
            </div>
          )}
        </div>

        {/* Faucet */}
        {isAuthenticated && user?.address && (
          <div className="bo-note bo-note-warn mt-5 p-3.5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <span className="bo-label-sm block text-gold">Testing on testnet?</span>
                <span className="mt-1.5 block text-2xs text-ink-3">
                  Get 10,000 free testnet XLM for this wallet
                </span>
              </div>
              <button
                type="button"
                onClick={handleFundFriendbot}
                disabled={funding}
                className="bo-btn bo-btn-gold shrink-0 px-3.5 py-2.5 text-2xs uppercase tracking-[0.12em]"
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
              <p aria-live="polite" className="mt-3 border-t border-line-1 pt-3 text-2xs text-ink-2">
                {fundingMessage}
              </p>
            )}
          </div>
        )}

        {/* Action */}
        <div className="mt-6">
          {isAuthenticated ? (
            <button
              type="button"
              onClick={handlePay}
              disabled={paying}
              className="bo-btn bo-btn-primary min-h-[52px] w-full px-5 py-4 text-sm uppercase tracking-[0.1em]"
            >
              {paying ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  <span>Processing</span>
                </>
              ) : (
                <>
                  <Wallet className="h-4 w-4" aria-hidden="true" />
                  <span>
                    Pay {formatAmount(request.amount)} {request.currency}
                  </span>
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={openLoginModal}
              disabled={isAuthLoading}
              className="bo-btn bo-btn-primary min-h-[52px] w-full px-5 py-4 text-sm uppercase tracking-[0.1em]"
            >
              <Wallet className="h-4 w-4" aria-hidden="true" />
              <span>Connect wallet to pay</span>
            </button>
          )}

          <div className="mt-4 flex items-center justify-center gap-2 text-center">
            <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-teal" aria-hidden="true" />
            <span className="bo-label-sm">Settlement confirmed on Stellar Horizon</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PaymentCheckoutPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const requestId = resolvedParams.id;

  return (
    <Suspense
      fallback={
        <div className="flex flex-1 items-center justify-center p-16">
          <Loader2 className="h-6 w-6 animate-spin text-teal" aria-label="Loading" />
        </div>
      }
    >
      <PaymentCheckoutContent requestId={requestId} />
    </Suspense>
  );
}
