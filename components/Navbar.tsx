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
  Sparkles,
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
    <header className="sticky top-0 z-40 w-full border-b border-[#075E54]/10 bg-[#F8F7F2]/90 backdrop-blur-md transition-all">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-3 group transition-opacity hover:opacity-95">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#075E54] text-white shadow-md shadow-[#075E54]/20 group-hover:bg-[#064e46] transition-colors">
              <Receipt className="h-5 w-5 text-[#F2A900]" />
            </div>
            <div className="flex flex-col">
              <span className="font-heading text-lg font-black tracking-tight text-[#102A2A] leading-tight flex items-center gap-1">
                Chamba<span className="text-[#075E54]">Receipts</span>
              </span>
              <span className="text-[10px] font-semibold tracking-wider uppercase text-[#5F6F6D]">
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
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? "bg-[#075E54]/10 text-[#075E54] font-bold shadow-2xs"
                      : "text-[#5F6F6D] hover:text-[#102A2A] hover:bg-white/60"
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? "text-[#075E54]" : "text-[#5F6F6D]"}`} />
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right Section: Auth & Actions */}
        <div className="flex items-center gap-3">
          {isAuthenticated && user ? (
            <div className="flex items-center gap-2.5">
              {/* Wallet Pill */}
              <div className="hidden sm:flex items-center gap-2.5 px-3.5 py-1.5 rounded-full border border-[#075E54]/20 bg-white shadow-2xs text-xs">
                <div className="flex items-center gap-1.5 text-[#102A2A] font-semibold">
                  <Wallet className="h-3.5 w-3.5 text-[#075E54]" />
                  <span>{formatAmount(balance)} {currency}</span>
                </div>
                <span className="h-3.5 w-px bg-[#075E54]/15" />
                <span className="font-mono text-[#5F6F6D] text-2xs" title={user.address}>
                  {shortAddress(user.address, 4, 4)}
                </span>
              </div>

              {/* Logout Button */}
              <button
                onClick={logout}
                title="Log out of Pollar"
                className="inline-flex items-center justify-center rounded-xl border border-[#075E54]/20 bg-white p-2 text-[#5F6F6D] transition-colors hover:bg-red-50 hover:text-red-600 hover:border-red-200 cursor-pointer shadow-2xs"
              >
                <LogOut className="h-4 w-4" />
                <span className="sr-only">Log out</span>
              </button>
            </div>
          ) : (
            <button
              onClick={login}
              disabled={isLoading}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#075E54] px-4 py-2 text-sm font-bold text-white shadow-md shadow-[#075E54]/20 transition-all hover:bg-[#064e46] active:scale-[0.98] disabled:opacity-60 cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5 text-[#F2A900]" />
              <span>{isLoading ? "Connecting..." : "Sign in with Pollar"}</span>
            </button>
          )}

          {/* Mobile menu hamburger button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden inline-flex items-center justify-center rounded-xl border border-[#075E54]/20 bg-white p-2 text-[#102A2A] hover:bg-[#075E54]/5 cursor-pointer shadow-2xs"
            aria-label="Toggle Navigation"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#075E54]/10 bg-[#F8F7F2] px-4 pt-3 pb-6 shadow-xl animate-in slide-in-from-top duration-200">
          {isAuthenticated && user && (
            <div className="mb-4 rounded-2xl border border-[#075E54]/15 bg-white p-4 text-xs shadow-2xs">
              <div className="flex items-center justify-between text-[#102A2A] font-semibold mb-1.5">
                <span className="text-[#5F6F6D]">Pollar Wallet Balance:</span>
                <span className="font-bold text-[#075E54] text-sm">{formatAmount(balance)} {currency}</span>
              </div>
              <div className="flex items-center justify-between text-[#5F6F6D] font-mono text-2xs pt-1.5 border-t border-slate-100">
                <span>Address:</span>
                <span>{shortAddress(user.address, 6, 6)}</span>
              </div>
            </div>
          )}

          <nav className="flex flex-col gap-1.5">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-base font-semibold transition-all ${
                    isActive
                      ? "bg-[#075E54] text-white shadow-md shadow-[#075E54]/20"
                      : "text-[#102A2A] hover:bg-white"
                  }`}
                >
                  <Icon className={`h-5 w-5 ${isActive ? "text-[#F2A900]" : "text-[#5F6F6D]"}`} />
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
