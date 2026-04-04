"use client";
import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import Link from "next/link";
import { SrecCard } from "@/components/SrecCard";
import { StatCard } from "@/components/StatCard";
import { LiveMintFeed } from "@/components/LiveMintFeed";

// Demo SRECs — in production these come from Helius DAS API
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

export default function ProducerPage() {
  const { connected, publicKey } = useWallet();
  const [srecs, setSrecs] = useState(DEMO_SRECS);
  const [listingId, setListingId] = useState<number | null>(null);
  const [listPrice, setListPrice] = useState("");
  const [txPending, setTxPending] = useState(false);
  const [latestMint, setLatestMint] = useState<string | null>(null);

  // Simulate a new SREC minting live while on the page
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
    // Simulate transaction — replace with actual Anchor program call
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
      <div className="flex items-center justify-between mb-8">
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Minted" value={minted} color="#F5A623" />
        <StatCard label="Listed" value={listed} color="#FF6B35" />
        <StatCard label="Retired" value={retired} color="#44BB44" />
        <StatCard label="Total Earned" value={`$${totalEarned}`} color="#FFC85A" />
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* SREC list */}
        <div className="md:col-span-2">
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
          {/* Live feed */}
          <LiveMintFeed />

          {/* System info */}
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
              <button
                className="btn-outline"
                onClick={() => setListingId(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
