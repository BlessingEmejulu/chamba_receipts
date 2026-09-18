# Implementation Plan: Chamba Receipts Production Hardening & Cross-Device Sharing

This implementation plan outlines the prioritized technical enhancements to transform Chamba Receipts from a single-browser hackathon demonstration into a resilient, cross-device, production-grade non-custodial payment and proof-of-income platform.

---

## User Review Required

> [!IMPORTANT]
> **Zero Centralized Database Option (Stateless Blockchain-Backed Architecture)**:
> Rather than introducing a centralized backend database (PostgreSQL/Supabase) that would require cloud hosting, API keys, and maintenance, we can achieve 100% cross-device compatibility by:
> 1. Encoding payment request metadata directly in URL query parameters (`/pay/REQ-XXXX?to=G...&amt=50&cur=USDC&memo=CR-XXXX&desc=...`)
> 2. Reconstructing public digital receipts on-demand directly from the **Stellar Horizon blockchain API** using the on-chain transaction hash or memo.
>
> This maintains 100% non-custodial integrity, zero server operating cost, and ensures payment links and receipts work anywhere in the world on any device.

---

## Proposed Changes

### Phase 1: Critical Fixes & Cross-Device Portability (P0)

#### [MODIFY] [lib/pollar.tsx](file:///c:/Users/SUVIC/Documents/HACKATHON/chamba_receipts/lib/pollar.tsx)
- Guard `getPollarClient` against SSR execution so `new PollarClient()` is only called in the browser (`typeof window !== "undefined"`).
- Suppress server-side console warnings during Next.js static prerendering.

#### [MODIFY] [app/pay/[id]/page.tsx](file:///c:/Users/SUVIC/Documents/HACKATHON/chamba_receipts/app/pay/[id]/page.tsx)
- Add **Query Parameter Hydration**: If `getPaymentRequest(id)` returns null (e.g. customer opened link on their own phone or laptop), parse parameters (`to`, `amt`, `cur`, `memo`, `desc`, `worker`) from `searchParams` to construct a valid in-memory `PaymentRequest`.
- Implement **Exponential Backoff Polling** for Horizon verification (1.5s, 3s, 5s) to eliminate false negatives during Stellar network congestion.

#### [MODIFY] [app/receive/page.tsx](file:///c:/Users/SUVIC/Documents/HACKATHON/chamba_receipts/app/receive/page.tsx)
- Update link generator to append self-contained query parameters:
  `https://domain/pay/${requestId}?to=${workerAddress}&amt=${amount}&cur=${currency}&memo=${memo}&desc=${encodeURIComponent(description)}&worker=${encodeURIComponent(workerName)}`
- Update generated QR code to point to this self-contained link.

#### [MODIFY] [app/receipt/[id]/page.tsx](file:///c:/Users/SUVIC/Documents/HACKATHON/chamba_receipts/app/receipt/[id]/page.tsx) & [app/transaction/[id]/page.tsx](file:///c:/Users/SUVIC/Documents/HACKATHON/chamba_receipts/app/transaction/[id]/page.tsx)
- Support **On-Chain Receipt Resolution**: If receipt ID is not found in `localStorage`, attempt to query Stellar Horizon using a `?tx=${hash}` query parameter.
- Allow third parties (loan officers, clients, landlords) to view and verify the receipt without having the freelancer's local browser storage.

---

### Phase 2: Financial Accuracy & Export Utilities (P1)

#### [MODIFY] [lib/storage.ts](file:///c:/Users/SUVIC/Documents/HACKATHON/chamba_receipts/lib/storage.ts)
- Replace native floating-point math in financial aggregations with string-based decimal/scaled integer arithmetic (cents) to prevent IEEE-754 precision drift (`0.1 + 0.2`).
- Add export utility function `exportPaymentsToCsv(records: PaymentRecord[]): string`.

#### [MODIFY] [app/income/page.tsx](file:///c:/Users/SUVIC/Documents/HACKATHON/chamba_receipts/app/income/page.tsx)
- Add a **"Download CSV"** button allowing workers to export their verified payment ledger for accounting and tax reporting.

---

### Phase 3: Cryptographic Proof & UX Polish (P2)

#### [MODIFY] [components/ReceiptCard.tsx](file:///c:/Users/SUVIC/Documents/HACKATHON/chamba_receipts/components/ReceiptCard.tsx)
- Add deterministic **Receipt Verification Hash (SHA-256)** combining `(id + txHash + amount + date + workerAddress)` rendered on physical printouts.
- Include print CSS optimizations ensuring clean page breaks and high-contrast rendering for formal physical presentations.

---

## Verification Plan

### Automated Tests
- Run `npx.cmd tsc --noEmit` to guarantee strict type safety.
- Run `npm.cmd run build` to ensure all 9 dynamic routes compile and render cleanly.

### Manual Verification
1. **Cross-Device Simulation**:
   - Create a payment link on `http://localhost:3000/receive`.
   - Open the generated link in an **Incognito / Private Window** (simulating a separate device with clean `localStorage`).
   - Verify that the checkout card hydrates completely with correct amount, recipient address, and memo.
2. **Receipt Verification**:
   - View `/receipt/:id?tx=...` in an incognito window and confirm on-chain receipt rendering.
3. **CSV Export**:
   - Navigate to `/income` and click "Export CSV", checking that the exported CSV accurately reflects recorded earnings.
