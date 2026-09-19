import type { Metadata, Viewport } from "next";
import { Inter_Tight, JetBrains_Mono } from "next/font/google";
import { PollarAppProvider } from "@/lib/pollar";
import { Navbar } from "@/components/Navbar";
import { ChambaMark } from "@/components/ChambaMark";
import "./globals.css";

/**
 * Blackout specifies Lausanne as the single family throughout. Lausanne is a
 * licensed face, so Inter Tight stands in: the same compact neo-grotesk
 * skeleton, tight tracking, and a full weight range. To adopt real Lausanne
 * later, swap this one declaration for a next/font/local definition bound to
 * the same --font-blackout variable; nothing else in the system changes.
 */
const blackout = Inter_Tight({
  variable: "--font-blackout",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

/**
 * Reserved for Stellar public keys and transaction hashes only. Character
 * disambiguation is a correctness requirement when someone is verifying a
 * 56-character address by eye, so it earns its place beside the single family.
 */
const blackoutMono = JetBrains_Mono({
  variable: "--font-blackout-mono",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#06060C",
};

export const metadata: Metadata = {
  title: "Chamba Receipts - Turn every payment into proof of income",
  description:
    "A human-centered payment and income-record platform for African freelancers, creators, artisans, and independent workers. Built on Pollar and Stellar.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${blackout.variable} ${blackoutMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-canvas text-ink font-sans">
        <PollarAppProvider>
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:bg-teal focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-[#04140f]"
          >
            Skip to content
          </a>

          <Navbar />

          <main id="main" className="flex-1 flex flex-col">
            {children}
          </main>

          <footer className="relative mt-auto border-t border-line-2 bg-surface-1 print:hidden">
            <div className="bo-grid absolute inset-0 opacity-40 pointer-events-none" />

            <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 bo-rails">
              <div className="flex flex-col gap-6 py-10 sm:flex-row sm:items-start sm:justify-between">
                <div className="max-w-sm">
                  <div className="flex items-center gap-2.5">
                    <ChambaMark className="h-5 w-5 text-teal" />
                    <span className="bo-heading text-sm font-semibold uppercase tracking-[0.18em] text-ink">
                      Chamba Receipts
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-ink-2">
                    Every payment tells a story of work, progress, and
                    possibility.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-x-10 gap-y-4 sm:grid-cols-2">
                  <div>
                    <div className="bo-label-sm">Settlement</div>
                    <div className="mt-2 text-sm text-ink-2">
                      Pollar &middot; Stellar
                    </div>
                  </div>
                  <div>
                    <div className="bo-label-sm">Custody</div>
                    <div className="mt-2 text-sm text-teal">Non-custodial</div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2 border-t border-line-1 py-5 text-2xs sm:flex-row sm:items-center sm:justify-between">
                <span className="bo-label-sm">
                  &copy; 2026 Chamba &middot; All rights reserved
                </span>
                <span className="bo-label-sm bo-code tracking-[0.2em]">
                  CHAMBA-OS / v1
                </span>
              </div>
            </div>
          </footer>
        </PollarAppProvider>
      </body>
    </html>
  );
}
