import * as dotenv from "dotenv";
dotenv.config({ path: "../.env" });

import { getProduction } from "./enphase";
import { mintSrec } from "./mint";
import {
  getAllSystems,
  updateSystemKwh,
  recordMint,
  logPoll,
  getNextSerialNumber,
  healthCheck,
} from "./db";

// ─────────────────────────────────────────────────────────────
// HELIOS ORACLE — Main Polling Loop
//
// Every POLL_INTERVAL_MS:
//   1. Read all registered solar systems from DB
//   2. Fetch latest production data from Enphase (mock or live)
//   3. Check if any system has crossed a 1 MWh threshold
//   4. If yes → call Anchor program to mint an SREC certificate
//   5. Record everything in DB
// ─────────────────────────────────────────────────────────────

const POLL_INTERVAL_MS = parseInt(process.env.POLL_INTERVAL_MS || "5000");
const MWH_THRESHOLD_KWH = 1000; // 1 MWh = 1 SREC

// In-memory cache of last known lifetime kWh per system
// (DB is source of truth — this just reduces redundant queries)
const kwhCache: Record<string, number> = {};

async function processSystems(): Promise<void> {
  const systems = await getAllSystems();

  for (const system of systems) {
    try {
      // Get latest production data
      const production = await getProduction(system.id);
      const prevKwh = kwhCache[system.id] ?? system.lifetime_kwh;
      const deltaKwh = production.lifetimeKwh - prevKwh;

      // How many new SRECs have been earned?
      const prevSrecs = Math.floor(prevKwh / MWH_THRESHOLD_KWH);
      const newSrecs = Math.floor(production.lifetimeKwh / MWH_THRESHOLD_KWH);
      const srecsDue = newSrecs - prevSrecs;

      // Update cache and DB
      kwhCache[system.id] = production.lifetimeKwh;
      await updateSystemKwh(system.id, production.lifetimeKwh);

      // Log the poll
      await logPoll({
        systemId: system.id,
        lifetimeKwh: production.lifetimeKwh,
        deltaKwh: deltaKwh > 0 ? deltaKwh : 0,
        srecsMinted: srecsDue,
      });

      if (srecsDue > 0) {
        // ── THRESHOLD CROSSED — MINT SRECS ────────────────────
        console.log("\n" + "═".repeat(60));
        console.log(`🌞 THRESHOLD CROSSED — System ${system.id}`);
        console.log(`   Lifetime: ${production.lifetimeKwh.toFixed(2)} kWh`);
        console.log(`   New SRECs earned: ${srecsDue}`);
        console.log(`   State: ${system.state}`);
        console.log(`   Owner: ${system.owner_wallet}`);

        for (let i = 0; i < srecsDue; i++) {
          const serialNumber = await getNextSerialNumber();
          const vintageYear = new Date().getFullYear();

          console.log(`\n   Minting SREC #${serialNumber}...`);

          const result = await mintSrec({
            systemId: system.id,
            ownerWallet: system.owner_wallet,
            state: system.state,
            vintageYear,
            mwhGenerated: 1,
            serialNumber,
          });

          if (result.success) {
            // Record in DB
            await recordMint({
              systemId: system.id,
              ownerWallet: system.owner_wallet,
              state: system.state,
              vintageYear,
              mwhGenerated: 1,
              mintTxHash: result.txHash,
              cnftAssetId: `HELIOS-${serialNumber}-${system.state}-${vintageYear}`,
            });

            console.log(`   ✅ SREC #${serialNumber} minted successfully`);
            console.log(`   📜 Certificate: HELIOS-${serialNumber}-${system.state}-${vintageYear}`);
            if (!result.simulated) {
              console.log(`   🔗 https://explorer.solana.com/tx/${result.txHash}?cluster=devnet`);
            } else {
              console.log(`   ⚡ [Simulated — deploy Anchor program for live minting]`);
            }
          } else {
            console.error(`   ❌ Failed to mint SREC #${serialNumber}`);
          }
        }

        console.log("═".repeat(60) + "\n");
      } else {
        // Normal poll — no threshold crossed
        const nextThreshold =
          Math.ceil(production.lifetimeKwh / MWH_THRESHOLD_KWH) *
          MWH_THRESHOLD_KWH;
        const remaining = nextThreshold - production.lifetimeKwh;

        process.stdout.write(
          `\r⚡ ${system.id} | ${production.lifetimeKwh.toFixed(1)} kWh | next SREC in ${remaining.toFixed(1)} kWh   `
        );
      }
    } catch (err) {
      console.error(`\n[Oracle] Error processing ${system.id}:`, err);
    }
  }
}

async function startOracle(): Promise<void> {
  console.clear();
  console.log("╔══════════════════════════════════════════════╗");
  console.log("║         🌞 HELIOS PROTOCOL ORACLE             ║");
  console.log("║   Solar energy → on-chain certificates        ║");
  console.log("╚══════════════════════════════════════════════╝");
  console.log("");
  console.log(`Mode:     ${process.env.ENPHASE_MODE || "mock"}`);
  console.log(`Interval: ${POLL_INTERVAL_MS}ms`);
  console.log(`Network:  ${process.env.SOLANA_RPC || "devnet"}`);
  console.log("");

  // Check DB connection
  const dbOk = await healthCheck();
  if (!dbOk) {
    console.error("❌ Cannot connect to database.");
    console.error("   Run: docker-compose up -d");
    process.exit(1);
  }
  console.log("✅ Database connected");
  console.log("✅ Oracle running — watching for 1 MWh thresholds...\n");

  // Initial poll immediately, then on interval
  await processSystems();
  setInterval(processSystems, POLL_INTERVAL_MS);
}

// Handle graceful shutdown
process.on("SIGINT", () => {
  console.log("\n\n🛑 Oracle shutting down...");
  process.exit(0);
});

startOracle().catch((err) => {
  console.error("Fatal oracle error:", err);
  process.exit(1);
});
