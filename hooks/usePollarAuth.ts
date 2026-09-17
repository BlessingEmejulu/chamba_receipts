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

const DEMO_STORAGE_KEY = "chamba_demo_user";

const DEFAULT_DEMO_USER: PollarUser = {
  address: "GDEMO77K65A7KEMEJULUBL3SSINGCHAMBA2026STELLARUSDC",
  displayName: "Blessing Emejulu",
  email: "blessing@chamba.design",
  profile: {
    first_name: "Blessing",
    last_name: "Emejulu",
    mail: "blessing@chamba.design",
    avatar: null,
    providers: [],
  } as unknown as PollarUserProfile,
  wallet: {
    address: "GDEMO77K65A7KEMEJULUBL3SSINGCHAMBA2026STELLARUSDC",
    custody: "smart",
    provider: "passkey",
  } as WalletInfo,
};

export function usePollarAuth() {
  const {
    isAuthenticated: isPollarAuthenticated,
    verified,
    wallet,
    logout: pollarLogout,
    openLoginModal,
    getClient,
  } = usePollar();

  const [authStep, setAuthStep] = useState<AuthState["step"]>("idle");
  const [demoUser, setDemoUser] = useState<PollarUser | null>(null);
  const [, startTransition] = useTransition();

  // Load demo user from localStorage if present
  useEffect(() => {
    try {
      const stored = localStorage.getItem(DEMO_STORAGE_KEY);
      if (stored) {
        setDemoUser(JSON.parse(stored));
      }
    } catch {
      // ignore storage errors
    }
  }, []);

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

  const realPollarUser: PollarUser | null =
    isPollarAuthenticated && wallet
      ? {
          address: wallet.address,
          profile,
          wallet,
          displayName,
          email,
        }
      : null;

  const activeUser = realPollarUser || demoUser;
  const isAuthenticated = Boolean(isPollarAuthenticated || demoUser);

  const loginWithDemo = (customName = "Blessing Emejulu", customAddress?: string) => {
    const userToSet: PollarUser = {
      address: customAddress?.trim() || DEFAULT_DEMO_USER.address,
      displayName: customName,
      email: `${customName.toLowerCase().replace(/\s+/g, ".")}@chamba.design`,
      profile: {
        first_name: customName.split(" ")[0] || "Worker",
        last_name: customName.split(" ").slice(1).join(" ") || "",
        mail: `${customName.toLowerCase().replace(/\s+/g, ".")}@chamba.design`,
        avatar: null,
        providers: [],
      } as unknown as PollarUserProfile,
      wallet: {
        address: customAddress?.trim() || DEFAULT_DEMO_USER.address,
        custody: "smart",
        provider: "passkey",
      } as WalletInfo,
    };
    try {
      localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(userToSet));
    } catch {}
    setDemoUser(userToSet);
  };


  const logout = () => {
    try {
      localStorage.removeItem(DEMO_STORAGE_KEY);
    } catch {}
    setDemoUser(null);
    try {
      pollarLogout();
    } catch {}
  };

  return {
    user: activeUser,
    isAuthenticated,
    isDemoMode: Boolean(!realPollarUser && demoUser),
    isLoading: !SETTLED_STEPS.includes(authStep),
    login: openLoginModal,
    loginWithDemo,
    logout,
    verified: Boolean(verified || demoUser),
    wallet: activeUser?.wallet || null,
  };
}
