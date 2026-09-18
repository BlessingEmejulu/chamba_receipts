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
  if (typeof window === "undefined") {
    // Suppress benign server-side constructor warning during Next.js SSR/prerender
    const originalWarn = console.warn;
    console.warn = (...args: unknown[]) => {
      if (typeof args[0] === "string" && args[0].includes("[PollarClient] constructor()")) return;
      originalWarn(...args);
    };
    try {
      globalPollar.__pollarClient ??= new PollarClient({
        apiKey: key,
        stellarNetwork: key.startsWith("pub_mainnet_") ? "mainnet" : "testnet",
      });
    } finally {
      console.warn = originalWarn;
    }
  } else {
    globalPollar.__pollarClient ??= new PollarClient({
      apiKey: key,
      stellarNetwork: key.startsWith("pub_mainnet_") ? "mainnet" : "testnet",
    });
  }
  return globalPollar.__pollarClient;
}

const appConfig = {
  application: {
    name: "Chamba Receipts",
    network: (publishableKey.startsWith("pub_mainnet_") ? "mainnet" : "testnet") as "mainnet" | "testnet",
    chains: ["STELLAR" as const],
  },
  styles: {
    theme: "light",
    accentColor: "#059669",
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
