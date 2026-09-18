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
  const { user, isAuthenticated, isLoading, login, logout } = usePollarAuth();
  const { balance, currency } = useBalance();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
                title="Log out of Pollar"
                className="inline-flex items-center justify-center rounded-lg border border-slate-200 p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
              >
                <LogOut className="h-4 w-4" />
                <span className="sr-only">Log out</span>
              </button>
            </div>
          ) : (
            <button
              onClick={login}
              disabled={isLoading}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-700 active:scale-[0.98] disabled:opacity-60"
            >
              <Wallet className="h-4 w-4" />
              <span>{isLoading ? "Connecting..." : "Sign in with Pollar"}</span>
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
