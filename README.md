# Helios Protocol — MVP

> Mint, trade, and retire solar energy certificates on Solana — in seconds, not months.

---

## Project Structure

```
helios-mvp/
├── helios-program/          ← Anchor smart contract (Rust/Solana)
│   └── programs/
│       └── helios-program/
│           └── src/lib.rs   ← Core protocol logic
├── oracle-service/          ← Node.js oracle (inverter → blockchain)
│   └── src/
│       ├── oracle.ts        ← Main polling loop
│       ├── enphase.ts       ← Enphase API adapter
│       ├── mint.ts          ← Calls Anchor program to mint cNFT
│       └── db.ts            ← PostgreSQL state tracking
├── frontend/                ← Next.js dashboard
│   └── src/
│       ├── app/             ← Pages (producer + utility)
│       ├── components/      ← UI components
│       └── lib/             ← Solana helpers
├── .env.example             ← All environment variables
├── docker-compose.yml       ← Spins up PostgreSQL locally
└── package.json             ← Root scripts
```

---

## Quick Start

### 1. Prerequisites
```bash
# Node.js 20+
nvm install 20 && nvm use 20

# Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"

# Anchor
cargo install --git https://github.com/coral-xyz/anchor avm --locked
avm install latest && avm use latest
```

### 2. Environment
```bash
cp .env.example .env
# Fill in your keys (Enphase, Solana wallet path, DB url)
```

### 3. Database
```bash
docker-compose up -d
```

### 4. Deploy Anchor Program
```bash
cd helios-program
anchor build
anchor deploy --provider.cluster devnet
# Copy program ID into .env as PROGRAM_ID
```

### 5. Oracle Service
```bash
cd oracle-service
npm install
npm run dev
```

### 6. Frontend
```bash
cd frontend
npm install
npm run dev
# Open http://localhost:3000
```

---

## MVP Scope

| Feature | Status |
|---|---|
| Enphase API → production data | ✅ Simulated + real API ready |
| 1 MWh threshold detection | ✅ Oracle polling loop |
| cNFT mint on threshold | ✅ Anchor program |
| SREC marketplace listing | ✅ Anchor program |
| Atomic burn + USDC settle | ✅ Anchor program |
| Producer dashboard | ✅ Next.js |
| Utility buyer portal | ✅ Next.js |
| Retirement proof PDF | ✅ Auto-generated |

---

## Demo Flow

1. Oracle detects 1,000 kWh produced by simulated system
2. Calls Anchor program → cNFT mints to producer wallet
3. Producer logs into dashboard → sees certificate → lists for $190
4. Utility buyer logs in → sees listing → purchases
5. Certificate burns on-chain (atomic with USDC payment)
6. Retirement proof PDF auto-downloads with tx hash

**Total time: under 10 seconds. vs. 2–4 months the traditional way.**
