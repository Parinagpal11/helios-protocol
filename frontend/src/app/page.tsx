"use client";
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6">
      {/* Logo */}
      <div className="text-center mb-16">
        <div className="flex items-center justify-center gap-3 mb-4">
          {/* Sun icon */}
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <circle cx="24" cy="24" r="10" fill="#F5A623" />
            {[0,45,90,135,180,225,270,315].map((deg, i) => (
              <line
                key={i}
                x1="24" y1="6"
                x2="24" y2="2"
                stroke="#F5A623"
                strokeWidth="2.5"
                strokeLinecap="round"
                transform={`rotate(${deg} 24 24)`}
              />
            ))}
          </svg>
          <h1
            className="text-6xl font-bold tracking-tight"
            style={{ fontFamily: "Georgia", color: "#F5A623" }}
          >
            Helios
          </h1>
        </div>
        <p className="text-xl font-bold text-white mb-2" style={{ fontFamily: "Georgia" }}>
          Protocol
        </p>
        <p className="text-sm" style={{ color: "#8A96B0" }}>
          Mint, trade and retire solar energy certificates on Solana
        </p>
      </div>

      {/* Role selector */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
        {/* Producer */}
        <Link href="/producer">
          <div
            className="card cursor-pointer hover:scale-105 transition-transform"
            style={{ borderColor: "rgba(245,166,35,0.4)" }}
          >
            <div className="text-4xl mb-4">🏠</div>
            <h2
              className="text-2xl font-bold text-white mb-2"
              style={{ fontFamily: "Georgia" }}
            >
              I own solar panels
            </h2>
            <p style={{ color: "#8A96B0", fontSize: "0.9rem" }}>
              Connect your inverter, watch SRECs mint automatically, list them
              for sale and get paid in USDC.
            </p>
            <div className="mt-4">
              <span className="badge badge-minted">Producer Dashboard →</span>
            </div>
          </div>
        </Link>

        {/* Utility */}
        <Link href="/utility">
          <div
            className="card cursor-pointer hover:scale-105 transition-transform"
            style={{ borderColor: "rgba(255,107,53,0.4)" }}
          >
            <div className="text-4xl mb-4">⚡</div>
            <h2
              className="text-2xl font-bold text-white mb-2"
              style={{ fontFamily: "Georgia" }}
            >
              I'm a utility buyer
            </h2>
            <p style={{ color: "#8A96B0", fontSize: "0.9rem" }}>
              Browse available SRECs across all 29 state markets, purchase for
              compliance, get instant retirement proof.
            </p>
            <div className="mt-4">
              <span className="badge badge-listed">Utility Portal →</span>
            </div>
          </div>
        </Link>
      </div>

      {/* Stats bar */}
      <div
        className="mt-16 flex gap-10 text-center"
        style={{ color: "#8A96B0", fontSize: "0.8rem" }}
      >
        {[
          { val: "$28B", label: "REC Market" },
          { val: "3.6M+", label: "Solar Homes" },
          { val: "29", label: "State Markets" },
          { val: "< 1s", label: "Settlement" },
        ].map((s) => (
          <div key={s.label}>
            <div
              className="text-xl font-bold"
              style={{ color: "#F5A623", fontFamily: "Georgia" }}
            >
              {s.val}
            </div>
            <div>{s.label}</div>
          </div>
        ))}
      </div>

      <p className="mt-8 text-xs" style={{ color: "#8A96B0" }}>
        Running on Solana Devnet · Colosseum Frontier Hackathon 2026
      </p>
    </main>
  );
}
