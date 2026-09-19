"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { usePollarAuth } from "@/hooks/usePollarAuth";
import { useBalance } from "@/hooks/useBalance";
import { shortAddress, formatAmount } from "@/lib/stellar";
import { Mark } from "@/components/blackout";
import { ChambaMark } from "@/components/ChambaMark";
import {
  LayoutDashboard,
  PlusCircle,
  History,
  FileText,
  User,
  Menu,
  X,
  LogOut,
  ArrowRight,
} from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading, login, logout } = usePollarAuth();
  const { balance, currency, usdcBalance, xlmBalance } = useBalance();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/receive", label: "Receive", icon: PlusCircle },
    { href: "/income", label: "Income", icon: History },
    { href: "/report", label: "Report", icon: FileText },
    { href: "/profile", label: "Profile", icon: User },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-line-2 bg-canvas/85 backdrop-blur-xl print:hidden">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand mark */}
        <div className="flex items-center gap-8">
          <Link
            href="/"
            className="group flex items-center gap-3"
            aria-label="Chamba Receipts home"
          >
            <span className="flex h-9 w-9 items-center justify-center border border-line-2 bg-surface-2 transition-colors group-hover:border-teal/50">
              <ChambaMark className="h-5 w-5 text-teal" />
            </span>
            <span className="flex flex-col leading-none">
              <span className="bo-heading text-sm font-semibold uppercase tracking-[0.16em] text-ink">
                Chamba
              </span>
              <span className="bo-label-sm mt-1">Proof of Income</span>
            </span>
          </Link>

          {/* Desktop navigation */}
          <nav className="hidden items-center md:flex" aria-label="Primary navigation">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive =
                pathname === link.href ||
                (link.href !== "/" && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={isActive ? "page" : undefined}
                  className={`relative flex items-center gap-2 border-l border-line-1 px-4 py-2.5 text-xs font-medium uppercase tracking-[0.1em] transition-colors last:border-r ${
                    isActive ? "text-teal" : "text-ink-3 hover:text-ink"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                  {link.label}
                  {isActive && (
                    <span
                      className="absolute inset-x-0 -bottom-px h-px bg-teal"
                      aria-hidden="true"
                    />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Wallet readout & auth */}
        <div className="flex items-center gap-2">
          {isAuthenticated && user ? (
            <div className="flex items-center gap-2">
              <div className="hidden items-stretch border border-line-2 bg-surface-2 sm:flex">
                <div className="flex flex-col justify-center px-3 py-1.5">
                  <span className="bo-label-sm leading-none">Balance</span>
                  <span className="bo-num mt-1.5 text-xs font-semibold leading-none text-ink">
                    {parseFloat(usdcBalance) > 0
                      ? formatAmount(usdcBalance)
                      : parseFloat(xlmBalance) > 0
                      ? formatAmount(xlmBalance)
                      : "0.00"}{" "}
                    <span className="text-teal">
                      {parseFloat(usdcBalance) > 0
                        ? "USDC"
                        : parseFloat(xlmBalance) > 0
                        ? "XLM"
                        : "USDC"}
                    </span>
                  </span>
                </div>
                <span className="w-px bg-line-2" aria-hidden="true" />
                <div className="flex flex-col justify-center px-3 py-1.5">
                  <span className="bo-label-sm leading-none">Wallet</span>
                  <span
                    className="bo-code mt-1.5 text-2xs leading-none text-ink-2"
                    title={user.address}
                  >
                    {shortAddress(user.address, 4, 4)}
                  </span>
                </div>
              </div>

              <button
                onClick={logout}
                title="Log out of Pollar"
                className="bo-btn bo-btn-ghost h-9 w-9"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                <span className="sr-only">Log out</span>
              </button>
            </div>
          ) : (
            <button
              onClick={login}
              disabled={isLoading}
              className="bo-btn bo-btn-primary px-4 py-2.5 text-xs uppercase tracking-[0.1em]"
            >
              <span>{isLoading ? "Connecting" : "Sign in"}</span>
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          )}

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="bo-btn bo-btn-ghost h-9 w-9 md:hidden"
            aria-label="Toggle navigation"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? (
              <X className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Menu className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileMenuOpen && (
        <div className="bo-enter border-t border-line-2 bg-surface-1 md:hidden">
          {isAuthenticated && user && (
            <div className="border-b border-line-1 px-4 py-4">
              <div className="flex items-center justify-between">
                <span className="bo-label-sm">Wallet balance</span>
                <span className="bo-num text-sm font-semibold text-ink">
                  {formatAmount(balance)} <span className="text-teal">{currency}</span>
                </span>
              </div>
              <div className="mt-2.5 flex items-center justify-between border-t border-line-1 pt-2.5">
                <span className="bo-label-sm">Address</span>
                <span className="bo-code text-2xs text-ink-2">
                  {shortAddress(user.address, 6, 6)}
                </span>
              </div>
            </div>
          )}

          <nav className="flex flex-col" aria-label="Mobile navigation">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive =
                pathname === link.href ||
                (link.href !== "/" && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  aria-current={isActive ? "page" : undefined}
                  className={`flex items-center gap-3 border-b border-line-1 px-4 py-4 text-sm font-medium uppercase tracking-[0.1em] transition-colors ${
                    isActive
                      ? "bg-teal/10 text-teal"
                      : "text-ink-2 hover:bg-white/[0.03] hover:text-ink"
                  }`}
                >
                  {isActive ? (
                    <Mark accent />
                  ) : (
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  )}
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
