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

export function useBalance() {
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
