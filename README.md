# ☀️ Helios Protocol

> **Mint, trade and retire solar energy certificates on Solana — in seconds, not months.**

Named for Helios — the Greek titan who carried sunlight across the sky every day.

---

## The Problem

The US solar credit (SREC) market is worth **$28 billion** and runs entirely on paper.

| Pain Point | Today | Helios |
|---|---|---|
| Time to get paid | 2–4 months | < 10 seconds |
| Broker fee | 5–10% | 0.5% |
| Market access | 1 state at a time | All 29 states |
| Fraud prevention | Manual audits | On-chain burn |

---

## How It Works

```
Inverter API → Oracle → Anchor Program → cNFT minted → DEX listed → Utility buys → Token burns → USDC settled
```

**Layer 1 — IoT Oracle → Mint**
The moment a solar system crosses 1,000 kWh, a Solana oracle reads from the Enphase or SolarEdge API and mints a compressed NFT certificate automatically. No forms. No 30-day wait. Under 400 milliseconds.

**Layer 2 — Cross-State DEX**
Producers list certificates on a single marketplace. Utility companies — legally required to buy SRECs or pay heavy government fines — bid across all 29 state markets from one dashboard for the first time.

**Layer 3 — Atomic Burn and Settle**
Certificate burns and USDC transfers in the same transaction. If either fails, both fail. Double-counting is cryptographically impossible. A regulatory retirement proof PDF auto-generates with the on-chain transaction hash — ready for immediate regulatory filing.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Smart Contract | Anchor (Solana) |
| Certificates | Compressed NFTs via Metaplex Bubblegum v2 |
| Oracle | Pyth / Switchboard + Node.js adapter |
| Inverter Data | Enphase API v4 + SolarEdge Monitoring API |
| Frontend | Next.js 14 + Tailwind CSS |
| Wallet | Solana Wallet Adapter (Phantom, Solflare) |
| Settlement | USDC via Circle |
| Database | PostgreSQL |
| Network | Solana Devnet |

---

## Project Structure

```
helios-protocol/
├── helios-program/               ← Anchor smart contract (Rust)
│   └── programs/helios-program/
│       └── src/lib.rs            ← mint_srec, list_srec, purchase_srec
├── oracle-service/               ← Node.js oracle (inverter → blockchain)
│   └── src/
│       ├── oracle.ts             ← Main polling loop
│       ├── enphase.ts            ← Enphase API adapter (mock + live)
│       ├── mint.ts               ← Calls Anchor program to mint cNFT
│       └── db.ts                 ← PostgreSQL state tracking
├── frontend/                     ← Next.js dashboard
│   └── src/
│       ├── app/producer/         ← Homeowner dashboard
│       ├── app/utility/          ← Utility compliance portal
│       ├── components/           ← SrecCard, StatCard, LiveMintFeed
│       └── lib/retirementPdf.ts  ← Auto-generates proof on purchase
├── db/init.sql                   ← Schema + 3 demo solar systems
├── docker-compose.yml            ← Spins up PostgreSQL locally
└── .env.example                  ← All environment variables
```

---

## Quick Start

### Prerequisites

```bash
# Node.js 20+
nvm install 20 && nvm use 20

# Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Solana CLI
brew install solana

# Anchor
cargo install --git https://github.com/coral-xyz/anchor avm --locked
avm install latest && avm use latest
```

### Run locally

```bash
# 1. Clone
git clone https://github.com/Parinagpal11/helios-protocol.git
cd helios-protocol

# 2. Environment
cp .env.example .env

# 3. Database
docker-compose up -d

# 4. Oracle (Terminal 1)
cd oracle-service && npm install && npm run dev

# 5. Frontend (Terminal 2)
cd frontend && npm install && npm run dev

# 6. Open http://localhost:3000
```

### Deploy Anchor program to devnet

```bash
cd helios-program
anchor build
anchor deploy --provider.cluster devnet
# Copy program ID into .env as PROGRAM_ID
```

---

## Demo Flow

1. Oracle detects 1,000 kWh produced by solar system
2. Calls Anchor program → cNFT mints to producer wallet
3. Producer logs into dashboard → sees certificate → lists for $190
4. Utility buyer logs in → sees listing → purchases
5. Certificate burns on-chain (atomic with USDC payment)
6. Retirement proof PDF auto-downloads with tx hash

**Total time: under 10 seconds. vs. 2–4 months the traditional way.**

---

## Market Opportunity

| Metric | Value |
|---|---|
| REC market size 2025 | $27.99B |
| Projected by 2030 | $45.45B |
| US homes with solar | 3.6M+ |
| Active SREC states | 29 |
| DC SREC price | $440 per certificate |
| NJ SREC price | $190 per certificate |
| Traditional broker fee | 5–10% |
| Helios protocol fee | 0.5% |

---

## Why Solana

| Factor | Ethereum | Solana |
|---|---|---|
| Mint 1M SRECs | ~$12,000 | ~$5 |
| Settlement time | 12+ seconds | 400ms |
| Fee per tx | $5–50 | <$0.001 |
| RWA ecosystem | Legacy | Leading |

Compressed NFTs via Bubblegum make minting 24,000× cheaper than standard NFTs — essential for scaling to millions of residential solar systems nationally.

---



## Roadmap

**Week 1** — Oracle + on-chain mint working on devnet
**Week 2** — Full trading loop (list → buy → burn → settle)
**Week 3** — Producer dashboard with real user testing
**Week 4** — Utility portal + retirement proof + live URL
**Week 5** — Pitch video + Colosseum submission

---

## Hackathon

Built for the **Colosseum Frontier Hackathon 2026** — RWA Track.
April 6 – May 11, 2026.

---

## License

MIT © 2026 Helios Protocol

---

> *The sun rises every day. So should the income it generates.*
