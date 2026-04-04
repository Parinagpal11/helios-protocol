"use client";
import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import Link from "next/link";
import { SrecCard } from "@/components/SrecCard";
import { StatCard } from "@/components/StatCard";
import { generateRetirementPDF } from "@/lib/retirementPdf";

// Demo marketplace listings
const MARKET_LISTINGS = [
  { id: 10, serialNumber: 10, systemId: "SYS-DC-001", state: "DC",
    vintageYear: 2026, mwhGenerated: 1, status: "listed",
    listPrice: 410, estimatedValue: 410,
    createdAt: new Date(Date.now() - 1800000).toISOString() },
  { id: 11, serialNumber: 11, systemId: "SYS-NJ-001", state: "NJ",
    vintageYear: 2026, mwhGenerated: 1, status: "listed",
    listPrice: 190, estimatedValue: 190,
    createdAt: new Date(Date.now() - 3600000).toISOString() },
  { id: 12, serialNumber: 12, systemId: "SYS-MA-001", state: "MA",
    vintageYear: 2026, mwhGenerated: 1, status: "listed",
    listPrice: 240, estimatedValue: 240,
    createdAt: new Date(Date.now() - 7200000).toISOString() },
  { id: 13, serialNumber: 13, systemId: "SYS-NJ-002", state: "NJ",
    vintageYear: 2025, mwhGenerated: 1, status: "listed",
    listPrice: 175, estimatedValue: 175,
    createdAt: new Date(Date.now() - 14400000).toISOString() },
  { id: 14, serialNumber: 14, systemId: "SYS-MD-001", state: "MD",
    vintageYear: 2026, mwhGenerated: 1, status: "listed",
    listPrice: 58, estimatedValue: 58,
    createdAt: new Date(Date.now() - 21600000).toISOString() },
];

export default function UtilityPage() {
  const { connected } = useWallet();
  const [listings, setListings] = useState(MARKET_LISTINGS);
  const [stateFilter, setStateFilter] = useState("ALL");
  const [purchasingId, setPurchasingId] = useState<number | null>(null);
  const [purchased, setPurchased] = useState<typeof MARKET_LISTINGS>([]);
  const [txPending, setTxPending] = useState(false);

  const states = ["ALL", "DC", "NJ", "MA", "MD", "PA", "VA"];

  const filtered = stateFilter === "ALL"
    ? listings
    : listings.filter((l) => l.state === stateFilter);

  const totalSpent = purchased.reduce((s, p) => s + p.listPrice, 0);

  const handlePurchase = async (listing: typeof MARKET_LISTINGS[0]) => {
    setTxPending(true);
    setPurchasingId(listing.id);

    // Simulate atomic burn + USDC transfer (replace with Anchor program call)
    await new Promise((r) => setTimeout(r, 2200));

    // Remove from marketplace
    setListings((prev) => prev.filter((l) => l.id !== listing.id));

    // Add to purchased/retired
    const retired = { ...listing, status: "retired" };
    setPurchased((prev) => [retired, ...prev]);

    // Auto-generate retirement proof PDF
    await generateRetirementPDF({
      serialNumber: listing.serialNumber,
      systemId: listing.systemId,
      state: listing.state,
      vintageYear: listing.vintageYear,
      priceUsdc: listing.listPrice,
      buyerWallet: "Demo Utility Wallet",
      txHash: `HELIOS_TX_${Date.now()}`,
      retiredAt: new Date(),
    });

    setTxPending(false);
    setPurchasingId(null);
  };

  return (
    <main className="min-h-screen px-6 py-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link href="/" className="text-xs mb-1 block" style={{ color: "#8A96B0" }}>
            ← Helios Protocol
          </Link>
          <h1 className="text-3xl font-bold text-white" style={{ fontFamily: "Georgia" }}>
            Utility Compliance Portal
          </h1>
          <p className="text-sm mt-1" style={{ color: "#8A96B0" }}>
            Browse, purchase and retire SRECs across all 29 state markets
          </p>
        </div>
        <WalletMultiButton />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Available" value={listings.length} color="#F5A623" />
        <StatCard label="Purchased" value={purchased.length} color="#44BB44" />
        <StatCard label="Total Spent" value={`$${totalSpent}`} color="#FFC85A" />
        <StatCard label="Proof PDFs" value={purchased.length} color="#FF6B35" />
      </div>

      {/* State filter */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {states.map((s) => (
          <button
            key={s}
            onClick={() => setStateFilter(s)}
            className="px-3 py-1 rounded-full text-sm font-medium transition-all"
            style={{
              background: stateFilter === s
                ? "rgba(245,166,35,0.2)"
                : "rgba(255,255,255,0.05)",
              border: stateFilter === s
                ? "1px solid rgba(245,166,35,0.6)"
                : "1px solid rgba(255,255,255,0.1)",
              color: stateFilter === s ? "#F5A623" : "#8A96B0",
            }}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Marketplace */}
        <div className="md:col-span-2">
          <h2 className="text-lg font-bold text-white mb-4" style={{ fontFamily: "Georgia" }}>
            Available SRECs {stateFilter !== "ALL" && `· ${stateFilter}`}
          </h2>

          {filtered.length === 0 ? (
            <div className="card text-center py-12" style={{ color: "#8A96B0" }}>
              <p className="text-4xl mb-4">🎉</p>
              <p>No listings available for {stateFilter}.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((listing) => (
                <SrecCard
                  key={listing.id}
                  srec={listing}
                  isOwner={false}
                  onPurchase={() => handlePurchase(listing)}
                  isPurchasing={purchasingId === listing.id && txPending}
                />
              ))}
            </div>
          )}
        </div>

        {/* Retired certificates sidebar */}
        <div>
          <h2 className="text-lg font-bold text-white mb-4" style={{ fontFamily: "Georgia" }}>
            Retired Certificates
          </h2>

          {purchased.length === 0 ? (
            <div className="card text-center py-8" style={{ color: "#8A96B0", fontSize: "0.85rem" }}>
              <p className="text-3xl mb-3">📋</p>
              <p>Purchased SRECs appear here.</p>
              <p className="mt-2">Each purchase auto-generates a retirement proof PDF for regulatory filing.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {purchased.map((p) => (
                <div key={p.id} className="card" style={{ padding: "1rem" }}>
                  <div className="flex justify-between items-start mb-2">
                    <span className="badge badge-retired">Retired</span>
                    <span className="font-bold" style={{ color: "#F5A623" }}>
                      ${p.listPrice}
                    </span>
                  </div>
                  <p className="text-white text-sm font-medium">
                    HELIOS-{p.serialNumber}-{p.state}-{p.vintageYear}
                  </p>
                  <p className="text-xs mt-1" style={{ color: "#8A96B0" }}>
                    {p.systemId} · 1 MWh
                  </p>
                  <p className="text-xs mt-2" style={{ color: "#44BB44" }}>
                    ✓ Retirement proof downloaded
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Info box */}
          <div className="card mt-4" style={{ padding: "1rem" }}>
            <h3 className="font-bold text-white text-sm mb-2" style={{ fontFamily: "Georgia" }}>
              How retirement works
            </h3>
            <p className="text-xs" style={{ color: "#8A96B0", lineHeight: 1.7 }}>
              When you purchase an SREC, the certificate token is permanently
              burned on Solana in the same atomic transaction as the USDC
              payment. Double-counting is cryptographically impossible.
              A retirement proof PDF is auto-generated with the on-chain
              transaction hash for regulatory filing.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
