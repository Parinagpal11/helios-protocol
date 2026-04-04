import axios from "axios";
import * as dotenv from "dotenv";
dotenv.config({ path: "../.env" });

export interface SystemProduction {
  systemId: string;
  lifetimeKwh: number;
  lastIntervalKwh: number;
  lastUpdated: Date;
}

// ── MOCK DATA ─────────────────────────────────────────────────
// Simulates realistic solar production for 3 demo systems.
// Accelerated for demo: ~1 MWh every 2 minutes at 5s poll interval.
// Real production: ~1 MWh every 1–2 months for a 10kW home system.

const mockState: Record<string, number> = {
  "SYS-NJ-001": 0,
  "SYS-DC-001": 0,
  "SYS-MA-001": 0,
};

function getMockProduction(systemId: string): SystemProduction {
  // Each poll adds ~14.6 kWh (accelerated from real 15-min data)
  // At 5s poll intervals this crosses 1 MWh in ~70 polls (~6 minutes)
  const increment = 14.6 + (Math.random() - 0.5) * 2;
  mockState[systemId] = (mockState[systemId] || 0) + increment;

  return {
    systemId,
    lifetimeKwh: mockState[systemId],
    lastIntervalKwh: increment,
    lastUpdated: new Date(),
  };
}

// ── LIVE ENPHASE API ──────────────────────────────────────────
// Requires approved developer account at developer-v4.enphase.com
// Uses OAuth2 client credentials flow

let accessToken: string | null = null;
let tokenExpiry: number = 0;

async function getEnphaseToken(): Promise<string> {
  if (accessToken && Date.now() < tokenExpiry) return accessToken;

  const response = await axios.post(
    "https://api.enphaseenergy.com/oauth/token",
    new URLSearchParams({
      grant_type: "client_credentials",
    }),
    {
      auth: {
        username: process.env.ENPHASE_CLIENT_ID!,
        password: process.env.ENPHASE_CLIENT_SECRET!,
      },
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    }
  );

  accessToken = response.data.access_token;
  tokenExpiry = Date.now() + response.data.expires_in * 1000 - 60000;
  return accessToken!;
}

async function getLiveProduction(systemId: string): Promise<SystemProduction> {
  const token = await getEnphaseToken();

  // Get lifetime energy stats
  const response = await axios.get(
    `https://api.enphaseenergy.com/api/v4/systems/${systemId}/energy_lifetime`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        key: process.env.ENPHASE_API_KEY!,
      },
    }
  );

  const data = response.data;
  const lifetimeWh = data.production.reduce(
    (sum: number, val: number) => sum + val,
    0
  );

  return {
    systemId,
    lifetimeKwh: lifetimeWh / 1000,
    lastIntervalKwh: data.production[data.production.length - 1] / 1000 || 0,
    lastUpdated: new Date(data.end_date),
  };
}

// ── PUBLIC API ────────────────────────────────────────────────

export async function getProduction(
  systemId: string
): Promise<SystemProduction> {
  const mode = process.env.ENPHASE_MODE || "mock";

  if (mode === "mock") {
    return getMockProduction(systemId);
  } else {
    try {
      return await getLiveProduction(systemId);
    } catch (err) {
      console.warn(`[Enphase] Live API failed for ${systemId}, falling back to mock:`, err);
      return getMockProduction(systemId);
    }
  }
}
