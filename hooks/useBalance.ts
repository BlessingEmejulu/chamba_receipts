"use client";

import { useEffect, useRef } from "react";
import { usePollar } from "@pollar/react";
import type { WalletBalanceRecord } from "@pollar/core";

function primaryRecord(
  balances: WalletBalanceRecord[]
): WalletBalanceRecord | null {
  return (
    balances.find((b) => b.enabledInApp && b.type !== "native") ??
    balances.find((b) => b.type === "native") ??
    balances[0] ??
    null
  );
}

import { usePollarAuth } from "./usePollarAuth";

export function useBalance() {
  const { isAuthenticated: isAnyAuth, isDemoMode } = usePollarAuth();
  const { isAuthenticated, verified, walletBalance, refreshWalletBalance } =
    usePollar();
  const retriedAfterVerify = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || !verified) return;
    if (walletBalance.step === "idle") {
      void refreshWalletBalance();
    } else if (walletBalance.step === "error" && !retriedAfterVerify.current) {
      retriedAfterVerify.current = true;
      void refreshWalletBalance();
    }
  }, [isAuthenticated, verified, walletBalance.step, refreshWalletBalance]);

  if (isDemoMode) {
    return {
      balance: "150.00",
      currency: "USDC",
      asset: {
        code: "USDC",
        balance: "150.00",
        type: "credit_alphanum4",
        enabledInApp: true,
      } as unknown as WalletBalanceRecord,
      balances: [
        { code: "USDC", balance: "150.00", type: "credit_alphanum4", enabledInApp: true },
        { code: "XLM", balance: "25.00", type: "native", enabledInApp: true },
      ] as unknown as WalletBalanceRecord[],
      isLoading: false,
      error: null,
      refresh: async () => {},
    };
  }

  const asset =
    walletBalance.step === "loaded"
      ? primaryRecord(walletBalance.data.balances)
      : null;

  return {
    balance: asset?.balance ?? null,
    currency: asset?.code ?? "USDC",
    asset,
    balances: walletBalance.step === "loaded" ? walletBalance.data.balances : [],
    isLoading:
      walletBalance.step === "loading" ||
      (isAuthenticated && walletBalance.step === "idle"),
    error: walletBalance.step === "error" ? walletBalance.message : null,
    refresh: refreshWalletBalance,
  };
}
