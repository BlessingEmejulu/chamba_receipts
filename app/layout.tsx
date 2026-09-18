import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import { PollarAppProvider } from "@/lib/pollar";
import { Navbar } from "@/components/Navbar";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
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
      className={`${jakarta.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#F8F7F2] text-[#102A2A] font-sans">
        <PollarAppProvider>
          <Navbar />
          <main className="flex-1 flex flex-col">{children}</main>
          <footer className="border-t border-[#E8E5DD] bg-white/80 py-8 text-xs text-[#5F6F6D] print:hidden">
            <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex flex-col sm:flex-row items-center gap-2 text-center sm:text-left">
                <span className="font-bold text-[#102A2A] tracking-tight">Chamba Receipts</span>
                <span className="hidden sm:inline text-slate-300">•</span>
                <p className="text-[#5F6F6D]">
                  Every payment tells a story of work, progress, and possibility.
                </p>
              </div>
              <div className="flex items-center gap-4 text-[#8A9694]">
                <span>Built on Pollar & Stellar</span>
                <span>•</span>
                <span>© 2026 Chamba</span>
              </div>
            </div>
          </footer>
        </PollarAppProvider>
      </body>
    </html>
  );
}
