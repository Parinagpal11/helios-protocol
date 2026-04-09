"use client";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import Link from "next/link";
import { SrecCard } from "@/components/SrecCard";
import { StatCard } from "@/components/StatCard";
import { LiveMintFeed } from "@/components/LiveMintFeed";

const DEMO_SRECS = [
  {
    id: 1, serialNumber: 1, systemId: "SYS-NJ-001", state: "NJ",
    vintageYear: 2026, mwhGenerated: 1, status: "minted",
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    estimatedValue: 190,
  },
  {
    id: 2, serialNumber: 2, systemId: "SYS-NJ-001", state: "NJ",
    vintageYear: 2026, mwhGenerated: 1, status: "listed",
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    estimatedValue: 190, listPrice: 195,
  },
  {
    id: 3, serialNumber: 3, systemId: "SYS-NJ-001", state: "NJ",
    vintageYear: 2025, mwhGenerated: 1, status: "retired",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    estimatedValue: 185, soldPrice: 188,
  },
];

const SREC_PRICES = [
  { state: "DC", price: 440, sacp: 480 },
  { state: "NJ", price: 190, sacp: 228 },
  { state: "MA", price: 250, sacp: 285 },
  { state: "MD", price: 58,  sacp: 75  },
  { state: "PA", price: 38,  sacp: 45  },
];

const priceHistory = [
  { day: "Apr 1", NJ: 185, DC: 435, MA: 245 },
  { day: "Apr 2", NJ: 188, DC: 438, MA: 248 },
  { day: "Apr 3", NJ: 187, DC: 440, MA: 247 },
  { day: "Apr 4", NJ: 190, DC: 442, MA: 250 },
  { day: "Apr 5", NJ: 192, DC: 439, MA: 252 },
  { day: "Apr 6", NJ: 190, DC: 441, MA: 250 },
  { day: "Apr 7", NJ: 191, DC: 440, MA: 251 },
];

export default function ProducerPage() {
  const { connected, publicKey } = useWallet();
  const [srecs, setSrecs] = useState(DEMO_SRECS);
  const [loading, setLoading] = useState(false);
  const [listingId, setListingId] = useState<number | null>(null);
  const [listPrice, setListPrice] = useState("");
  const [txPending, setTxPending] = useState(false);
  const [latestMint, setLatestMint] = useState<string | null>(null);

  useEffect(() => {
  if (!connected || !publicKey) return;
  setLoading(true);
  fetch(process.env.NEXT_PUBLIC_HELIUS_RPC!, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: "helios",
      method: "getAssetsByOwner",
      params: { ownerAddress: publicKey.toString(), page: 1, limit: 50 },
    }),
  })
    .then((r) => r.json())
    .then((data) => {
      const assets = data.result?.items || [];
      if (assets.length > 0) {
        const mapped = assets.map((a: any, i: number) => ({
          id: i + 1,
          serialNumber: i + 1,
          systemId: a.content?.metadata?.attributes?.find((x: any) => x.trait_type === "systemId")?.value || "SYS-NJ-001",
          state: a.content?.metadata?.attributes?.find((x: any) => x.trait_type === "state")?.value || "NJ",
          vintageYear: 2026,
          mwhGenerated: 1,
          status: "minted",
          createdAt: new Date().toISOString(),
          estimatedValue: 190,
        }));
        setSrecs(mapped);
      }
    })
    .catch(console.error)
    .finally(() => setLoading(false));
}, [connected, publicKey]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const newSrec = {
        id: 99, serialNumber: 99, systemId: "SYS-NJ-001", state: "NJ",
        vintageYear: 2026, mwhGenerated: 1, status: "minted",
        createdAt: new Date().toISOString(), estimatedValue: 192,
      };
      setSrecs((prev) => [newSrec, ...prev]);
      setLatestMint(`HELIOS-99-NJ-2026`);
      setTimeout(() => setLatestMint(null), 5000);
    }, 8000);
    return () => clearTimeout(timer);
  }, []);

  const handleList = async (srecId: number) => {
    if (!listPrice || isNaN(Number(listPrice))) return;
    setTxPending(true);
    await new Promise((r) => setTimeout(r, 1800));
    setSrecs((prev) =>
      prev.map((s) =>
        s.id === srecId
          ? { ...s, status: "listed", listPrice: Number(listPrice) }
          : s
      )
    );
    setListingId(null);
    setListPrice("");
    setTxPending(false);
  };

  const minted  = srecs.filter((s) => s.status === "minted").length;
  const listed  = srecs.filter((s) => s.status === "listed").length;
  const retired = srecs.filter((s) => s.status === "retired").length;
  const totalEarned = srecs
    .filter((s) => s.status === "retired")
    .reduce((sum, s) => sum + (s.soldPrice || 0), 0);

  return (
    <main className="min-h-screen px-6 py-8 max-w-5xl mx-auto">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        <div>
          <Link href="/" className="text-xs mb-1 block" style={{ color: "#8A96B0" }}>
            ← Helios Protocol
          </Link>
          <h1 className="text-3xl font-bold text-white" style={{ fontFamily: "Georgia" }}>
            Producer Dashboard
          </h1>
          <p className="text-sm mt-1" style={{ color: "#8A96B0" }}>
            System: SYS-NJ-001 · New Jersey · 10kW Enphase
          </p>
        </div>
        <WalletMultiButton />
      </div>

      {/* Live mint notification */}
      {latestMint && (
        <div
          className="mb-6 p-4 rounded-xl flex items-center gap-3"
          style={{ background: "rgba(245,166,35,0.12)", border: "1px solid rgba(245,166,35,0.4)" }}
        >
          <span className="text-2xl">✨</span>
          <div>
            <p className="font-bold text-white">New SREC minted!</p>
            <p className="text-sm" style={{ color: "#F5A623" }}>
              Certificate {latestMint} just minted on Solana devnet
            </p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Minted" value={minted} color="#F5A623" />
        <StatCard label="Listed" value={listed} color="#FF6B35" />
        <StatCard label="Retired" value={retired} color="#44BB44" />
        <StatCard label="Total Earned" value={`$${totalEarned}`} color="#FFC85A" />
      </div>

      {/* Live SREC Market Prices */}
      <div className="card mb-6">
        <h3 className="font-bold text-white mb-3" style={{ fontFamily: "Georgia" }}>
          Live SREC Market Prices
        </h3>
        <div className="flex gap-3 flex-wrap">
          {SREC_PRICES.map((s) => (
            <div key={s.state} className="text-center p-3 rounded-lg flex-1"
              style={{ background: "#0A0F1E", border: "0.5px solid rgba(245,166,35,0.2)", minWidth: "80px" }}>
              <div className="text-lg font-bold" style={{ color: "#F5A623", fontFamily: "Georgia" }}>${s.price}</div>
              <div className="text-xs font-bold text-white">{s.state}</div>
              <div className="text-xs" style={{ color: "#8A96B0" }}>SACP ${s.sacp}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 7-Day Price History */}
      <div className="card mb-6">
        <h3 className="font-bold text-white mb-4" style={{ fontFamily: "Georgia" }}>
          7-Day Price History
        </h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={priceHistory}>
            <XAxis dataKey="day" tick={{ fill: "#8A96B0", fontSize: 11 }} />
            <YAxis tick={{ fill: "#8A96B0", fontSize: 11 }} />
            <Tooltip contentStyle={{ background: "#131928", border: "1px solid #F5A623", color: "#fff" }} />
            <Line type="monotone" dataKey="NJ" stroke="#F5A623" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="DC" stroke="#FF6B35" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="MA" stroke="#5BA4F5" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
        <div className="flex gap-4 mt-2 text-xs" style={{ color: "#8A96B0" }}>
          <span style={{ color: "#F5A623" }}>— NJ</span>
          <span style={{ color: "#FF6B35" }}>— DC</span>
          <span style={{ color: "#5BA4F5" }}>— MA</span>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* SREC list */}
        <div className="md:col-span-2">
          {loading && (
            <p className="text-sm mb-4" style={{ color: "#8A96B0" }}>
              Loading certificates from wallet...
              </p>
            )}
          <h2 className="text-lg font-bold text-white mb-4" style={{ fontFamily: "Georgia" }}>
            Your Certificates
          </h2>
          <div className="space-y-3">
            {srecs.map((srec) => (
              <SrecCard
                key={srec.id}
                srec={srec}
                onList={() => setListingId(srec.id)}
                isOwner={true}
              />
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <LiveMintFeed />
          <div className="card">
            <h3 className="font-bold text-white mb-3" style={{ fontFamily: "Georgia" }}>
              System Info
            </h3>
            {[
              ["Inverter", "Enphase IQ8"],
              ["Size", "10 kW"],
              ["State", "New Jersey"],
              ["SACP", "$228/SREC"],
              ["Est. annual", "~10 SRECs/yr"],
              ["Est. income", "~$1,900/yr"],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between text-sm py-1"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                <span style={{ color: "#8A96B0" }}>{k}</span>
                <span className="text-white font-medium">{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* List modal */}
      {listingId !== null && (
        <div className="fixed inset-0 flex items-center justify-center z-50"
          style={{ background: "rgba(0,0,0,0.7)" }}>
          <div className="card w-full max-w-md mx-4">
            <h3 className="text-xl font-bold text-white mb-2" style={{ fontFamily: "Georgia" }}>
              List SREC for Sale
            </h3>
            <p className="text-sm mb-4" style={{ color: "#8A96B0" }}>
              NJ SRECs currently trading at ~$190–228. Enter your asking price in USDC.
            </p>
            <input
              type="number"
              placeholder="Price in USDC (e.g. 190)"
              value={listPrice}
              onChange={(e) => setListPrice(e.target.value)}
              className="w-full p-3 rounded-lg mb-4 text-white"
              style={{ background: "#0A0F1E", border: "1px solid rgba(245,166,35,0.3)" }}
            />
            <div className="flex gap-3">
              <button
                className="btn-primary flex-1"
                onClick={() => handleList(listingId)}
                disabled={txPending || !listPrice}
              >
                {txPending ? "Signing tx..." : "List Certificate"}
              </button>
              <button className="btn-outline" onClick={() => setListingId(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}