"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { usePollarAuth } from "@/hooks/usePollarAuth";
import { useBalance } from "@/hooks/useBalance";
import { shortAddress, formatAmount } from "@/lib/stellar";
import {
  Receipt,
  LayoutDashboard,
  PlusCircle,
  History,
  FileText,
  User,
  Menu,
  X,
  Wallet,
  LogOut,
  ExternalLink,
} from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading, isDemoMode, login, loginWithDemo, logout } = usePollarAuth();
  const { balance, currency } = useBalance();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [customAddress, setCustomAddress] = useState("");


  const navLinks = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/receive", label: "Receive Payment", icon: PlusCircle },
    { href: "/income", label: "Income History", icon: History },
    { href: "/report", label: "Income Report", icon: FileText },
    { href: "/profile", label: "Profile", icon: User },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-90">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm shadow-emerald-500/20">
              <Receipt className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-tight text-slate-900 leading-tight">
                Chamba<span className="text-emerald-600">Receipts</span>
              </span>
              <span className="text-[10px] font-medium tracking-wider uppercase text-slate-500">
                Proof of Income
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? "bg-emerald-50 text-emerald-700 font-semibold"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? "text-emerald-600" : "text-slate-500"}`} />
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right Section: Auth & Actions */}
        <div className="flex items-center gap-3">
          {isAuthenticated && user ? (
            <div className="flex items-center gap-3">
              {/* Wallet Pill */}
              <div className="hidden sm:flex items-center gap-2.5 px-3.5 py-1.5 rounded-full border border-slate-200 bg-slate-50/80 text-xs">
                {isDemoMode && (
                  <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">
                    DEMO
                  </span>
                )}
                <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                  <Wallet className="h-3.5 w-3.5 text-emerald-600" />
                  <span>{formatAmount(balance)} {currency}</span>
                </div>
                <span className="h-3.5 w-px bg-slate-200" />
                <span className="font-mono text-slate-600" title={user.address}>
                  {shortAddress(user.address, 4, 4)}
                </span>
              </div>

              {/* Logout Button */}
              <button
                onClick={logout}
                title="Log out"
                className="inline-flex items-center justify-center rounded-lg border border-slate-200 p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
              >
                <LogOut className="h-4 w-4" />
                <span className="sr-only">Log out</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => setAuthModalOpen(true)}
              disabled={isLoading}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-700 active:scale-[0.98] disabled:opacity-60"
            >
              <Wallet className="h-4 w-4" />
              <span>{isLoading ? "Connecting..." : "Connect Wallet"}</span>
            </button>
          )}

          {/* Mobile menu hamburger button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden inline-flex items-center justify-center rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Toggle Navigation"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Connect Wallet Modal */}
      {authModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white">
                  <Wallet className="h-4 w-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Connect to Chamba</h3>
              </div>
              <button
                onClick={() => setAuthModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="mt-3 text-xs text-slate-500">
              Choose how you want to connect to track proof of income and receive payments.
            </p>

            <div className="mt-4 flex flex-col gap-3">
              {/* Option 1: Instant Demo */}
              <button
                onClick={() => {
                  loginWithDemo("Blessing Emejulu");
                  setAuthModalOpen(false);
                }}
                className="flex items-start gap-3.5 rounded-xl border-2 border-emerald-500/80 bg-emerald-50/50 p-3.5 text-left transition-all hover:bg-emerald-50 hover:shadow-sm"
              >
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white font-bold text-xs">
                  ⚡
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-emerald-950">
                      Quick Start Demo Worker
                    </span>
                    <span className="rounded-full bg-emerald-200/80 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                      Recommended
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-emerald-800/80">
                    Continue as <strong>Blessing Emejulu</strong> with a pre-funded 150 USDC testnet balance. Zero setup required.
                  </p>
                </div>
              </button>

              {/* Option 2: Pollar Native Modal */}
              <button
                onClick={() => {
                  setAuthModalOpen(false);
                  login();
                }}
                className="flex items-start gap-3.5 rounded-xl border border-slate-200 p-3.5 text-left transition-all hover:border-slate-300 hover:bg-slate-50"
              >
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sky-700 font-bold text-xs">
                  🦊
                </div>
                <div>
                  <span className="text-sm font-semibold text-slate-900">
                    Official Pollar SDK Modal
                  </span>
                  <p className="mt-1 text-xs text-slate-500">
                    Connect via Pollar Smart Wallets, Passkeys, or Stellar browser extensions.
                  </p>
                </div>
              </button>

              {/* Option 3: Custom Stellar Address */}
              <div className="rounded-xl border border-slate-200 p-3.5">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Or enter your Stellar Public Key (G...):
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                    value={customAddress}
                    onChange={(e) => setCustomAddress(e.target.value)}
                    className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-mono text-slate-900 focus:border-emerald-500 focus:outline-none"
                  />
                  <button
                    onClick={() => {
                      if (customAddress.trim().startsWith("G")) {
                        loginWithDemo("Stellar Worker", customAddress.trim());
                        setAuthModalOpen(false);
                      } else {
                        alert("Please enter a valid Stellar public key starting with G");
                      }
                    }}
                    className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800"
                  >
                    Connect
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-5 shadow-lg">
          {isAuthenticated && user && (
            <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs">
              <div className="flex items-center justify-between text-slate-700 font-medium mb-1">
                <span>Pollar Wallet Balance:</span>
                <span className="font-bold text-emerald-700">{formatAmount(balance)} {currency}</span>
              </div>
              <div className="flex items-center justify-between text-slate-500 font-mono">
                <span>Address:</span>
                <span>{shortAddress(user.address, 6, 6)}</span>
              </div>
            </div>
          )}

          <nav className="flex flex-col gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-base font-medium transition-all ${
                    isActive
                      ? "bg-emerald-50 text-emerald-700 font-semibold"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <Icon className={`h-5 w-5 ${isActive ? "text-emerald-600" : "text-slate-500"}`} />
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
}
