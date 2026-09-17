# Chamba Receipts

> **"Turn every payment into proof of income."**

A payment and income-record web application for freelancers, informal workers, creators, artisans, and small service businesses built on **Pollar** and the **Stellar Blockchain**.

---

## Problem

Independent workers, freelancers, artisans, and small service providers often receive payments without having a structured, auditable record of what they earned and why they were paid. When applying for loans, apartment leases, business licenses, or equipment financing, they struggle to produce recognized "proof of income."

Traditional banking rails either exclude informal workers or enforce high processing fees and slow settlement. Existing crypto payment flows are often overwhelming for non-crypto natives—demanding seed phrases, confusing gas tokens, and complex wallet mechanics.

---

## Solution

**Chamba Receipts** bridges this gap by adding a trusted recordkeeping and verification layer on top of non-custodial Pollar payments:

1. **Service Providers** create simple payment requests (amount, currency, service description, customer name).
2. **Customers** receive a clean mobile-friendly checkout link (`/pay/:requestId`) and pay in seconds using their Pollar wallet with zero XLM transaction fees.
3. **Decentralized Settlement**: The transaction is signed and settled on the Stellar ledger in under 5 seconds.
4. **Digital Receipt & Income Proof**: Upon on-chain confirmation on Stellar Horizon, an immutable digital receipt (`/receipt/:paymentId`) is automatically issued, stamped "PAID", and added to the user's permanent income history and monthly report.

---

## What Pollar Does vs. What Chamba Receipts Adds

| Layer | Responsibility |
| :--- | :--- |
| **Pollar** | Non-custodial wallet infrastructure, social & email OTP onboarding, transaction building, gas sponsorship (zero user XLM fees), AWS KMS key encryption, and trustlines. |
| **Chamba Receipts** | Invoicing/request workflow, public checkout pages, Stellar Horizon payment verification, digital receipts, income history, monthly analytics, and printable proof of income. |

---

## Features

- **Pollar Non-Custodial Wallet**: Instant sign-in via Google, GitHub, or Email OTP without seed phrase management.
- **Payment Request Generator**: Create customized payment links for USDC and native XLM with unique Stellar memo references.
- **Customer Checkout**: Public, responsive checkout page (`/pay/:requestId`) optimized for WhatsApp, SMS, or QR code scans.
- **Automated Horizon Verification**: Validates on-chain transaction status, recipient destination, amount, and memo directly against Stellar Horizon before issuing a receipt.
- **Shareable Digital Receipts**: Beautiful, verifiable digital receipts (`/receipt/:paymentId`) with "PAID" badge, Stellar Expert explorer links, QR code, and print/PDF support.
- **Income History**: Chronological log of all confirmed payments with real-time search and currency filters.
- **Monthly Income Reports**: Printable summary and month-by-month financial statements suitable for banks and landlords.
- **Live Worker Dashboard**: Key metrics (Total Received, Payment Count, This Month, Average Payment) updating dynamically with confirmed transactions.

---

## Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router, React 19)
- **SDK**: Official `@pollar/core` and `@pollar/react`
- **Blockchain**: Stellar Network (Testnet & Mainnet)
- **Settlement Assets**: Circle USDC (`GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5` on testnet) & Native XLM
- **Styling**: Tailwind CSS v4 & Lucide Icons
- **Utility**: `qrcode.react`, `canvas-confetti`

---

## Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Configure the following variables:

```env
# Required: Pollar publishable API key from https://dashboard.pollar.xyz (Build -> API Keys)
NEXT_PUBLIC_POLLAR_PUBLISHABLE_KEY=pub_testnet_your_publishable_key_here

# Optional: Stellar Horizon URL override (defaults to testnet)
# NEXT_PUBLIC_HORIZON_URL=https://horizon-testnet.stellar.org

# Optional: USDC Issuer override
# NEXT_PUBLIC_USDC_ISSUER=GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5
```

---

## Installation & Running Locally

### 1. Clone the repository
```bash
git clone https://github.com/your-username/chamba-receipts.git
cd chamba-receipts
```

### 2. Install dependencies
```bash
npm install
```

### 3. Run development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build for production
```bash
npm run build
npm run start
```

---

## Hackathon Demo Walkthrough

### Demo Persona: **Blessing Emejulu** (Website Development)

1. **Sign In**: Blessing opens Chamba Receipts and clicks **Sign in with Pollar** (Google, GitHub, or Email OTP). Her non-custodial Stellar wallet address and balance load.
2. **Create Payment Request**: Blessing navigates to **Receive Payment** (`/receive`), enters:
   - **Amount**: `50.00`
   - **Currency**: `USDC`
   - **Description**: `Website Development`
   - **Customer**: `Acme Web Studio`
3. **Open Payment Page**: Blessing clicks **Generate Payment Link**. She copies the link (`/pay/REQ-XXXXXX`) or shares the QR code.
4. **Customer Checkout**: The customer opens the link and clicks **Pay 50.00 USDC with Pollar**.
5. **Real Settlement**: Pollar executes the transaction with sponsored fees.
6. **On-Chain Confirmation**: Chamba Receipts verifies the transaction on Stellar Horizon.
7. **Instant Receipt**: A verified **PAID** receipt (`/receipt/CR-XXXXXX`) is generated with a Stellar block explorer link.
8. **Dashboard & Report Updated**: Blessing's Dashboard updates its **Total Received** and **Income History**, and her **Income Report** reflects the verified revenue.

---

## Security Notes

- **Non-Custodial Architecture**: Private keys are encrypted and managed via Pollar AWS KMS infrastructure; private keys or seed phrases are never exposed to or stored by Chamba Receipts.
- **Verified Settlement**: Receipts are only issued once a transaction is verified on the Stellar ledger—preventing frontend spoofing.
- **Client Safe**: Only public keys and publishable API keys (`NEXT_PUBLIC_POLLAR_PUBLISHABLE_KEY`) are exposed to the client.

---

## Deployment

Chamba Receipts is ready for deployment on **Vercel**:

1. Push your code to GitHub.
2. Import project in Vercel.
3. Configure `NEXT_PUBLIC_POLLAR_PUBLISHABLE_KEY` in Project Settings -> Environment Variables.
4. Deploy!
