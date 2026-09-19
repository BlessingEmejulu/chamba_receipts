"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { usePollar } from "@pollar/react";
import type { WalletBalanceRecord } from "@pollar/core";
import { fetchAccountBalances, AccountBalancesResult } from "@/lib/stellar";

export interface UnifiedBalanceItem {
  code: string;
  balance: string;
  type: string;
  enabledInApp?: boolean;
}

export function useBalance() {
  const { isAuthenticated, walletBalance, refreshWalletBalance, wallet } =
    usePollar();
  const retriedAfterVerify = useRef(false);

  const [onChain, setOnChain] = useState<AccountBalancesResult>({
    usdc: "0.00",
    xlm: "0.00",
    hasUsdcTrustline: false,
    balances: [],
  });
  const [isOnChainLoading, setIsOnChainLoading] = useState(false);

  const userAddress = wallet?.address;

  const loadOnChain = useCallback(async (address?: string) => {
    if (!address) return;
    setIsOnChainLoading(true);
    try {
      const res = await fetchAccountBalances(address);
      setOnChain(res);
    } catch {
      // safe fallback
    } finally {
      setIsOnChainLoading(false);
    }
  }, []);

  // Fetch directly from Horizon whenever user address is available
  useEffect(() => {
    if (userAddress) {
      loadOnChain(userAddress);
    }
  }, [userAddress, loadOnChain]);

  // Also trigger Pollar SDK balance loading
  useEffect(() => {
    if (!isAuthenticated) return;
    if (walletBalance.step === "idle") {
      void refreshWalletBalance();
    } else if (walletBalance.step === "error" && !retriedAfterVerify.current) {
      retriedAfterVerify.current = true;
      void refreshWalletBalance();
    }
  }, [isAuthenticated, walletBalance.step, refreshWalletBalance]);

  // Read balances from Pollar SDK if available
  const pollarBalances: WalletBalanceRecord[] =
    walletBalance.step === "loaded" ? walletBalance.data.balances : [];

  const pollarUsdc = pollarBalances.find((b) => b.code === "USDC")?.balance;
  const pollarXlm = pollarBalances.find(
    (b) => b.type === "native" || b.code === "XLM"
  )?.balance;

  // Prioritize whichever source is higher / non-zero
  const effectiveUsdc =
    onChain.usdc && parseFloat(onChain.usdc) > 0
      ? onChain.usdc
      : pollarUsdc ?? onChain.usdc ?? "0.00";

  const effectiveXlm =
    onChain.xlm && parseFloat(onChain.xlm) > 0
      ? onChain.xlm
      : pollarXlm ?? onChain.xlm ?? "0.00";

  const hasTrustline =
    onChain.hasUsdcTrustline || pollarBalances.some((b) => b.code === "USDC");

  const hasUsdc = parseFloat(effectiveUsdc) > 0;
  const hasXlm = parseFloat(effectiveXlm) > 0;

  // Primary balance for fast display:
  // Prioritize USDC if > 0; if only XLM has balance, prioritize XLM; otherwise default to USDC 0.00
  const primaryCurrency: "USDC" | "XLM" = hasUsdc ? "USDC" : hasXlm ? "XLM" : "USDC";
  const primaryBalance = primaryCurrency === "USDC" ? effectiveUsdc : effectiveXlm;

  const unifiedBalances: UnifiedBalanceItem[] = [];
  if (hasTrustline) {
    unifiedBalances.push({
      code: "USDC",
      balance: effectiveUsdc,
      type: "credit",
      enabledInApp: true,
    });
  }
  unifiedBalances.push({
    code: "XLM",
    balance: effectiveXlm,
    type: "native",
    enabledInApp: true,
  });

  const refreshAll = useCallback(async () => {
    const promises: Promise<unknown>[] = [];
    if (userAddress) {
      promises.push(loadOnChain(userAddress));
    }
    if (isAuthenticated) {
      promises.push(refreshWalletBalance().catch(() => {}));
    }
    await Promise.allSettled(promises);
  }, [userAddress, isAuthenticated, loadOnChain, refreshWalletBalance]);

  return {
    balance: primaryBalance,
    currency: primaryCurrency,
    usdcBalance: effectiveUsdc,
    xlmBalance: effectiveXlm,
    hasUsdcTrustline: hasTrustline,
    asset: unifiedBalances[0] ?? null,
    balances: unifiedBalances,
    isLoading:
      (isOnChainLoading && !hasUsdc && !hasXlm) ||
      walletBalance.step === "loading" ||
      (isAuthenticated && walletBalance.step === "idle" && !userAddress),
    error: walletBalance.step === "error" ? walletBalance.message : null,
    refresh: refreshAll,
  };
}
