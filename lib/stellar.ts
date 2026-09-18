/**
 * Stellar & Horizon utilities for Chamba Receipts
 */

export const TESTNET_USDC_ISSUER =
  "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5";

export const MAINNET_USDC_ISSUER =
  "GA5ZSEJYB37JRC5JMCP5ZJYS4ENFSOFAKTOWYFCLJXSN5M5X3TMXCY4I";

export function getHorizonUrl(): string {
  if (process.env.NEXT_PUBLIC_HORIZON_URL) {
    return process.env.NEXT_PUBLIC_HORIZON_URL.replace(/\/$/, "");
  }
  const key = process.env.NEXT_PUBLIC_POLLAR_PUBLISHABLE_KEY || "";
  return key.startsWith("pub_mainnet_")
    ? "https://horizon.stellar.org"
    : "https://horizon-testnet.stellar.org";
}

export function getUsdcIssuer(): string {
  if (process.env.NEXT_PUBLIC_USDC_ISSUER) {
    return process.env.NEXT_PUBLIC_USDC_ISSUER.trim();
  }
  const key = process.env.NEXT_PUBLIC_POLLAR_PUBLISHABLE_KEY || "";
  return key.startsWith("pub_mainnet_")
    ? MAINNET_USDC_ISSUER
    : TESTNET_USDC_ISSUER;
}

export function getExplorerUrl(hash: string): string {
  const key = process.env.NEXT_PUBLIC_POLLAR_PUBLISHABLE_KEY || "";
  const net = key.startsWith("pub_mainnet_") ? "public" : "testnet";
  return `https://stellar.expert/explorer/${net}/tx/${hash}`;
}

export function looksLikeAddress(value: string): boolean {
  return /^G[A-Z2-7]{55}$/.test(value.trim());
}

export function shortAddress(address: string, start = 4, end = 4): string {
  if (!address || address.length <= start + end + 1) return address || "—";
  return `${address.slice(0, start)}…${address.slice(-end)}`;
}

export function formatAmount(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") return "0.00";
  const n = Number(value);
  if (Number.isNaN(n)) return String(value);
  return n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function normalizeAmount(value: string | number): string {
  const n = Number(value);
  if (Number.isNaN(n)) return String(value).trim();
  return n.toFixed(7);
}

export type PaymentAssetParam =
  | { type: "native" }
  | { type: "credit_alphanum4" | "credit_alphanum12"; code: string; issuer: string };

export function getPaymentAsset(currency: "USDC" | "XLM"): PaymentAssetParam {
  if (currency === "XLM") {
    return { type: "native" };
  }
  return {
    type: "credit_alphanum4",
    code: "USDC",
    issuer: getUsdcIssuer(),
  };
}

interface HorizonTx {
  successful?: boolean;
  memo?: string | null;
  memo_type?: string | null;
  hash?: string;
  source_account?: string;
}

interface HorizonOp {
  type?: string;
  to?: string;
  from?: string;
  amount?: string;
  asset_type?: string;
  asset_code?: string;
  asset_issuer?: string;
}

export interface HorizonVerificationResult {
  ok: boolean;
  error?: string;
  payerAddress?: string;
  amount?: string;
  memo?: string;
  txHash?: string;
}

/**
 * Verifies a payment on Stellar Horizon directly:
 * - Confirms tx exists and was successful
 * - Confirms memo matches expected payment memo (e.g. CR-xxxx)
 * - Confirms a payment operation transferred requested amount to the recipient
 */
export async function verifyPaymentOnHorizon(opts: {
  hash: string;
  destination: string;
  amount: string;
  expectedMemo?: string;
  currency?: "USDC" | "XLM";
}): Promise<HorizonVerificationResult> {
  const hash = opts.hash.trim().toLowerCase();
  if (!/^[a-f0-9]{64}$/.test(hash)) {
    return { ok: false, error: "Invalid Stellar transaction hash format." };
  }

  const horizon = getHorizonUrl();
  try {
    // 1. Fetch transaction
    const txRes = await fetch(`${horizon}/transactions/${hash}`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    if (txRes.status === 404) {
      return { ok: false, error: "Transaction not found yet on Stellar network. Please wait a moment." };
    }
    if (!txRes.ok) {
      return { ok: false, error: `Horizon returned HTTP ${txRes.status} error.` };
    }

    const tx: HorizonTx = await txRes.json();
    if (!tx.successful) {
      return { ok: false, error: "Transaction failed on the Stellar ledger." };
    }

    // 2. Validate memo if required
    if (opts.expectedMemo) {
      const txMemo = (tx.memo ?? "").trim();
      if (txMemo !== opts.expectedMemo.trim()) {
        return {
          ok: false,
          error: `Transaction memo '${txMemo}' does not match expected receipt identifier '${opts.expectedMemo}'.`,
        };
      }
    }

    // 3. Fetch operations
    const opsRes = await fetch(`${horizon}/transactions/${hash}/operations?limit=50`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    if (!opsRes.ok) {
      return { ok: false, error: "Could not retrieve transaction operations from Horizon." };
    }

    const opsData = await opsRes.json();
    const records: HorizonOp[] = opsData?._embedded?.records ?? [];

    const currency = opts.currency || "USDC";
    const expectedIssuer = getUsdcIssuer();

    const paymentOp = records.find((op) => {
      if (op.type !== "payment") return false;
      if (op.to !== opts.destination) return false;

      if (currency === "XLM") {
        if (op.asset_type !== "native") return false;
      } else {
        if (op.asset_code !== "USDC") return false;
        if (op.asset_issuer && op.asset_issuer !== expectedIssuer) return false;
      }

      // Check amount matching
      if (normalizeAmount(op.amount ?? "") !== normalizeAmount(opts.amount)) {
        return false;
      }
      return true;
    });

    if (!paymentOp) {
      return {
        ok: false,
        error: `No payment operation to ${shortAddress(opts.destination)} for ${opts.amount} ${currency} found in transaction.`,
      };
    }

    return {
      ok: true,
      payerAddress: paymentOp.from || tx.source_account || undefined,
      amount: paymentOp.amount,
      memo: tx.memo || undefined,
      txHash: hash,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: `Error verifying transaction on Horizon: ${message}` };
  }
}

export interface HorizonPaymentDetails {
  txHash: string;
  memo: string;
  sourceAccount: string;
  workerAddress: string;
  amount: string;
  currency: "USDC" | "XLM";
  assetIssuer?: string;
  createdAt: string;
  successful: boolean;
}

/**
 * Reconstructs payment receipt details directly from the Stellar Horizon blockchain.
 * Enables third-parties (e.g. loan officers, clients) to verify receipts statelessly.
 */
export async function fetchPaymentFromHorizon(hash: string): Promise<HorizonPaymentDetails | null> {
  const cleanHash = hash.trim().toLowerCase();
  if (!/^[a-f0-9]{64}$/.test(cleanHash)) return null;

  const horizon = getHorizonUrl();
  try {
    const txRes = await fetch(`${horizon}/transactions/${cleanHash}`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (!txRes.ok) return null;
    const tx: HorizonTx & { created_at?: string } = await txRes.json();
    if (!tx.successful) return null;

    const opsRes = await fetch(`${horizon}/transactions/${cleanHash}/operations?limit=50`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (!opsRes.ok) return null;
    const opsData = await opsRes.json();
    const records: HorizonOp[] = opsData?._embedded?.records ?? [];

    const paymentOp = records.find((op) => op.type === "payment");
    if (!paymentOp || !paymentOp.to || !paymentOp.amount) return null;

    const currency: "USDC" | "XLM" = paymentOp.asset_code === "USDC" ? "USDC" : "XLM";

    return {
      txHash: cleanHash,
      memo: tx.memo || `CR-${cleanHash.slice(0, 6).toUpperCase()}`,
      sourceAccount: paymentOp.from || tx.source_account || "",
      workerAddress: paymentOp.to,
      amount: paymentOp.amount,
      currency,
      assetIssuer: paymentOp.asset_issuer,
      createdAt: tx.created_at || new Date().toISOString(),
      successful: true,
    };
  } catch {
    return null;
  }
}
