"use client";

import React from "react";
import { PollarClient } from "@pollar/core";
import { PollarProvider } from "@pollar/react";
import "@pollar/react/styles.css";

const publishableKey =
  process.env.NEXT_PUBLIC_POLLAR_PUBLISHABLE_KEY || "pub_testnet_dummy_key_for_build";

/**
 * Exactly ONE PollarClient per API key, kept on globalThis so it survives
 * React StrictMode double-initialization and dev hot reloads. Two live
 * clients share one persisted session and refresh independently; the
 * single-use refresh-token rotation then trips the server's reuse detection
 * and logs the user out.
 */
const globalPollar = globalThis as { __pollarClient?: PollarClient };

export function getPollarClient(key: string): PollarClient {
  globalPollar.__pollarClient ??= new PollarClient({
    apiKey: key,
    // Publishable keys are network-scoped (pub_testnet_… / pub_mainnet_…),
    // so the key itself decides which Stellar network the app targets.
    stellarNetwork: key.startsWith("pub_mainnet_") ? "mainnet" : "testnet",
  });
  return globalPollar.__pollarClient;
}

import type { PollarConfig } from "@pollar/react";

const appConfig: PollarConfig = {
  application: {
    name: "Chamba Receipts",
    network: publishableKey.startsWith("pub_mainnet_") ? "mainnet" : "testnet",
    chains: ["STELLAR"],
  },
  styles: {
    theme: "light",
    accentColor: "#006241",
    modalTitle: "Chamba Receipts",
    emailEnabled: true,
    embeddedWallets: true,
    smartWallet: true,
    providers: {
      google: true,
      github: true,
    },
  },
};

/**
 * Single place where Pollar is initialized. Mounted once in app/layout.tsx;
 * everywhere else, consume Pollar via usePollar() from @pollar/react or the
 * custom hooks.
 */
export function PollarAppProvider({ children }: { children: React.ReactNode }) {
  const client = React.useMemo(() => getPollarClient(publishableKey), []);

  return (
    <PollarProvider client={client} appConfig={appConfig}>
      {children}
    </PollarProvider>
  );
}

