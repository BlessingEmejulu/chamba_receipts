import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { PollarAppProvider } from "@/lib/pollar";
import { Navbar } from "@/components/Navbar";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Chamba Receipts - Turn every payment into proof of income",
  description:
    "A payment and income-record application for freelancers, creators, artisans, and independent workers. Built on Pollar and Stellar.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 font-sans">
        <PollarAppProvider>
          <Navbar />
          <main className="flex-1 flex flex-col">{children}</main>
          <footer className="border-t border-slate-200/80 bg-white py-6 text-center text-xs text-slate-500 print:hidden">
            <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <p>
                © 2026 <strong>Chamba Receipts</strong>. Turn every payment into proof of income.
              </p>
              <div className="flex items-center gap-4 text-slate-400">
                <span>Built for Pollar Hackathon</span>
                <span>•</span>
                <span>Stellar Network</span>
              </div>
            </div>
          </footer>
        </PollarAppProvider>
      </body>
    </html>
  );
}
