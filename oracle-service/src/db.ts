import { Pool } from "pg";
import * as dotenv from "dotenv";
dotenv.config({ path: "../.env" });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export interface SystemRecord {
  id: string;
  owner_wallet: string;
  state: string;
  lifetime_kwh: number;
}

export interface SrecRecord {
  id: number;
  system_id: string;
  owner_wallet: string;
  state: string;
  vintage_year: number;
  mwh_generated: number;
  mint_tx_hash: string;
  cnft_asset_id: string;
  status: string;
}

export async function getAllSystems(): Promise<SystemRecord[]> {
  const result = await pool.query(
    "SELECT id, owner_wallet, state, lifetime_kwh FROM systems ORDER BY id"
  );
  return result.rows;
}

export async function updateSystemKwh(
  systemId: string,
  lifetimeKwh: number
): Promise<void> {
  await pool.query(
    "UPDATE systems SET lifetime_kwh = $1, last_polled_at = NOW() WHERE id = $2",
    [lifetimeKwh, systemId]
  );
}

export async function recordMint(params: {
  systemId: string;
  ownerWallet: string;
  state: string;
  vintageYear: number;
  mwhGenerated: number;
  mintTxHash: string;
  cnftAssetId: string;
}): Promise<number> {
  const result = await pool.query(
    `INSERT INTO srecs
       (system_id, owner_wallet, state, vintage_year, mwh_generated, mint_tx_hash, cnft_asset_id, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, 'minted')
     RETURNING id`,
    [
      params.systemId,
      params.ownerWallet,
      params.state,
      params.vintageYear,
      params.mwhGenerated,
      params.mintTxHash,
      params.cnftAssetId,
    ]
  );
  return result.rows[0].id;
}

export async function logPoll(params: {
  systemId: string;
  lifetimeKwh: number;
  deltaKwh: number;
  srecsMinted: number;
}): Promise<void> {
  await pool.query(
    `INSERT INTO oracle_polls (system_id, lifetime_kwh, delta_kwh, srecs_minted)
     VALUES ($1, $2, $3, $4)`,
    [params.systemId, params.lifetimeKwh, params.deltaKwh, params.srecsMinted]
  );
}

export async function getNextSerialNumber(): Promise<number> {
  const result = await pool.query(
    "SELECT COUNT(*) as count FROM srecs"
  );
  return parseInt(result.rows[0].count) + 1;
}

export async function healthCheck(): Promise<boolean> {
  try {
    await pool.query("SELECT 1");
    return true;
  } catch {
    return false;
  }
}
