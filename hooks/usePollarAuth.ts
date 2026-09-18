"use client";

import { useEffect, useState, useTransition } from "react";
import { usePollar } from "@pollar/react";
import type { AuthState, PollarUserProfile, WalletInfo } from "@pollar/core";

export interface PollarUser {
  /** Stellar address: user's stable id across every Pollar app. */
  address: string;
  /** Profile from Pollar session */
  profile: PollarUserProfile | null;
  /** Full wallet info: custody, login provider, funding mode. */
  wallet: WalletInfo;
  displayName: string;
  email: string | null;
}

export function getProfileDisplayName(profile?: PollarUserProfile | null): string {
  if (!profile) return "";
  const parts = [profile.first_name, profile.last_name].filter(Boolean);
  return parts.join(" ") || profile.mail || "";
}

export function getProfileEmail(profile?: PollarUserProfile | null): string | null {
  return profile?.mail || null;
}

/** Steps where the SDK is waiting on the user, not actively processing. */
const SETTLED_STEPS: AuthState["step"][] = [
  "idle",
  "authenticated",
  "error",
  "entering_email",
  "entering_code",
  "wallet_not_installed",
];

export function usePollarAuth() {
  const {
    isAuthenticated,
    verified,
    wallet,
    logout,
    openLoginModal,
    getClient,
  } = usePollar();

  const [authStep, setAuthStep] = useState<AuthState["step"]>("idle");
  const [, startTransition] = useTransition();

  useEffect(() => {
    try {
      const client = getClient();
      if (!client) return;
      return client.onAuthStateChange((state) => {
        startTransition(() => {
          setAuthStep(state.step);
        });
      });
    } catch {
      // safe fallback if client not ready yet
    }
  }, [getClient]);

  let profile: PollarUserProfile | null = null;
  try {
    profile = getClient().getUserProfile();
  } catch {
    profile = null;
  }

  const displayName = getProfileDisplayName(profile);
  const email = getProfileEmail(profile);

  const user: PollarUser | null =
    isAuthenticated && wallet
      ? {
          address: wallet.address,
          profile,
          wallet,
          displayName,
          email,
        }
      : null;

  return {
    user,
    isAuthenticated,
    isLoading: !SETTLED_STEPS.includes(authStep),
    login: openLoginModal,
    logout,
    verified,
    wallet,
  };
}
