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

/**
 * Funds any Stellar Testnet address with 10,000 free testnet XLM via official Stellar Friendbot.
 */
export async function fundWithFriendbot(address: string): Promise<{ ok: boolean; message: string }> {
  const clean = address.trim();
  if (!looksLikeAddress(clean)) {
    return { ok: false, message: "Invalid Stellar public key format." };
  }

  try {
    const res = await fetch(`https://friendbot.stellar.org/?addr=${encodeURIComponent(clean)}`);
    const data = await res.json();
    if (res.ok) {
      return { ok: true, message: "Account successfully created and funded with 10,000 testnet XLM!" };
    }
    return { ok: false, message: data.detail || data.title || "Friendbot funding failed." };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, message: `Could not reach Stellar Friendbot: ${msg}` };
  }
}

/**
 * Checks whether a given Stellar address has established a trustline for an asset.
 * Native XLM always returns true.
 */
export async function checkHasTrustline(
  address: string,
  assetCode: "USDC" | "XLM",
  assetIssuer?: string
): Promise<boolean> {
  if (assetCode === "XLM") return true;
  if (!looksLikeAddress(address)) return false;

  const horizon = getHorizonUrl();
  const issuer = assetIssuer || getUsdcIssuer();

  try {
    const res = await fetch(`${horizon}/accounts/${address.trim()}`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) return false;
    const data = await res.json();
    const balances = Array.isArray(data.balances) ? data.balances : [];
    return balances.some(
      (b: { asset_code?: string; asset_issuer?: string }) =>
        b.asset_code === "USDC" && (!issuer || b.asset_issuer === issuer)
    );
  } catch {
    return false;
  }
}

export interface AccountBalancesResult {
  usdc: string;
  xlm: string;
  hasUsdcTrustline: boolean;
  balances: Array<{ code: string; balance: string; type: string; issuer?: string }>;
}

/**
 * Fetches real-time on-chain balances directly from Stellar Horizon for any Stellar address.
 * Completely independent of local session cache; works on Vercel, localhost, mobile, etc.
 */
export async function fetchAccountBalances(address: string): Promise<AccountBalancesResult> {
  const clean = (address || "").trim();
  const defaultRes: AccountBalancesResult = {
    usdc: "0.00",
    xlm: "0.00",
    hasUsdcTrustline: false,
    balances: [],
  };

  if (!looksLikeAddress(clean)) return defaultRes;

  const horizon = getHorizonUrl();
  const issuer = getUsdcIssuer();

  try {
    const res = await fetch(`${horizon}/accounts/${clean}`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    if (!res.ok) {
      // 404 means the account is not yet funded on the Stellar network
      return defaultRes;
    }

    const data = await res.json();
    const raw = Array.isArray(data.balances) ? data.balances : [];

    let usdc = "0.00";
    let xlm = "0.00";
    let hasUsdc = false;

    const list = raw.map(
      (b: { balance?: string; asset_type?: string; asset_code?: string; asset_issuer?: string }) => {
        const bal = b.balance || "0";
        const isNative = b.asset_type === "native";
        const code = isNative ? "XLM" : b.asset_code || "UNKNOWN";

        if (isNative) {
          xlm = bal;
        }
        if (code === "USDC" && (!issuer || b.asset_issuer === issuer)) {
          usdc = bal;
          hasUsdc = true;
        }

        return {
          code,
          balance: bal,
          type: isNative ? "native" : "credit",
          issuer: b.asset_issuer,
        };
      }
    );

    return {
      usdc,
      xlm,
      hasUsdcTrustline: hasUsdc,
      balances: list,
    };
  } catch {
    return defaultRes;
  }
}

export interface HorizonIncomingPayment {
  txHash: string;
  type: string;
  amount: string;
  currency: "USDC" | "XLM";
  payerAddress: string;
  createdAt: string;
}

/**
 * Fetches transaction memo from Horizon by tx hash.
 */
export async function fetchTransactionMemo(hash: string): Promise<string | null> {
  const clean = hash.trim().toLowerCase();
  if (!/^[a-f0-9]{64}$/.test(clean)) return null;

  const horizon = getHorizonUrl();
  try {
    const res = await fetch(`${horizon}/transactions/${clean}`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.memo || null;
  } catch {
    return null;
  }
}

/**
 * Fetches all incoming payments for an account directly from Stellar Horizon.
 * Enables live syncing across different devices, sessions, or Vercel deployments.
 */
export async function fetchAccountIncomingPayments(
  address: string,
  limit = 50
): Promise<HorizonIncomingPayment[]> {
  const clean = (address || "").trim();
  if (!looksLikeAddress(clean)) return [];

  const horizon = getHorizonUrl();
  const issuer = getUsdcIssuer();

  try {
    const res = await fetch(
      `${horizon}/accounts/${clean}/payments?order=desc&limit=${limit}`,
      {
        headers: { Accept: "application/json" },
        cache: "no-store",
      }
    );

    if (!res.ok) return [];
    const data = await res.json();
    const records = Array.isArray(data?._embedded?.records) ? data._embedded.records : [];

    const incomingOps = records.filter(
      (op: {
        type?: string;
        transaction_successful?: boolean;
        to?: string;
        account?: string;
        funder?: string;
      }) => {
        if (op.transaction_successful === false) return false;

        // Skip testnet Friendbot faucet operations from showing as customer payments
        if (op.funder === "GAIH3ULLFQ4DGSECF2AR555KZ4KNDGEKN4AFI4SU2M7B43MGK3QJZNSR") {
          return false;
        }

        // Standard payment directed to this address
        if (
          (op.type === "payment" ||
            op.type === "path_payment_strict_send" ||
            op.type === "path_payment_strict_receive") &&
          op.to?.toLowerCase() === clean.toLowerCase()
        ) {
          return true;
        }

        // Account creation funding directed to this address (from non-faucet funder)
        if (
          op.type === "create_account" &&
          op.account?.toLowerCase() === clean.toLowerCase()
        ) {
          return true;
        }

        return false;
      }
    );

    const results: HorizonIncomingPayment[] = [];

    for (const op of incomingOps) {
      const isCreateAccount = op.type === "create_account";
      const isNative = isCreateAccount || op.asset_type === "native";
      const isUsdc =
        !isNative && op.asset_code === "USDC" && (!issuer || op.asset_issuer === issuer);

      // Only track USDC and XLM payments
      if (!isNative && !isUsdc) continue;

      const currency: "USDC" | "XLM" = isNative ? "XLM" : "USDC";
      const rawAmt = isCreateAccount ? op.starting_balance : op.amount;
      const parsedAmt = parseFloat(rawAmt || "0");
      if (isNaN(parsedAmt) || parsedAmt <= 0) continue;

      results.push({
        txHash: op.transaction_hash,
        type: op.type,
        amount: parsedAmt.toFixed(2),
        currency,
        payerAddress: op.from || op.funder || "",
        createdAt: op.created_at || new Date().toISOString(),
      });
    }

    return results;
  } catch {
    return [];
  }
}


