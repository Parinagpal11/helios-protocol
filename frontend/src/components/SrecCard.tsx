"use client";

interface Srec {
  id: number;
  serialNumber: number;
  systemId: string;
  state: string;
  vintageYear: number;
  mwhGenerated: number;
  status: string;
  listPrice?: number;
  soldPrice?: number;
  estimatedValue?: number;
  createdAt: string;
}

interface SrecCardProps {
  srec: Srec;
  isOwner: boolean;
  onList?: () => void;
  onPurchase?: () => void;
  isPurchasing?: boolean;
}

const STATE_SACP: Record<string, number> = {
  DC: 480, NJ: 228, MA: 285, MD: 75, VA: 75, PA: 45, OH: 50,
};

export function SrecCard({
  srec, isOwner, onList, onPurchase, isPurchasing,
}: SrecCardProps) {
  const sacp = STATE_SACP[srec.state] || 100;
  const displayPrice = srec.listPrice || srec.estimatedValue || 0;

  const statusColor = {
    minted:  "#F5A623",
    listed:  "#FF6B35",
    retired: "#44BB44",
  }[srec.status] || "#8A96B0";

  return (
    <div
      className="card"
      style={{
        padding: "1rem 1.25rem",
        borderColor: `${statusColor}30`,
        transition: "border-color 0.2s",
      }}
    >
      <div className="flex items-start justify-between gap-4">
        {/* Left: certificate info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className="badge"
              style={{
                background: `${statusColor}18`,
                color: statusColor,
                textTransform: "capitalize",
              }}
            >
              {srec.status}
            </span>
            <span className="text-xs" style={{ color: "#8A96B0" }}>
              #{srec.serialNumber}
            </span>
          </div>

          <p className="font-bold text-white text-sm">
            HELIOS-{srec.serialNumber}-{srec.state}-{srec.vintageYear}
          </p>

          <div
            className="flex gap-4 mt-2 text-xs"
            style={{ color: "#8A96B0" }}
          >
            <span>📍 {srec.state}</span>
            <span>⚡ {srec.mwhGenerated} MWh</span>
            <span>📅 {srec.vintageYear}</span>
            <span>🏭 {srec.systemId}</span>
          </div>

          {srec.status === "retired" && srec.soldPrice && (
            <p className="text-xs mt-2" style={{ color: "#44BB44" }}>
              ✓ Sold for ${srec.soldPrice} · Retirement proof on-chain
            </p>
          )}
        </div>

        {/* Right: price + action */}
        <div className="text-right flex-shrink-0">
          <p
            className="text-xl font-bold"
            style={{ color: "#F5A623", fontFamily: "Georgia" }}
          >
            ${displayPrice}
          </p>
          <p className="text-xs mb-2" style={{ color: "#8A96B0" }}>
            SACP: ${sacp}
          </p>

          {/* Producer: list button */}
          {isOwner && srec.status === "minted" && onList && (
            <button className="btn-primary text-sm px-3 py-1" onClick={onList}>
              List →
            </button>
          )}

          {/* Producer: already listed */}
          {isOwner && srec.status === "listed" && (
            <span className="text-xs" style={{ color: "#FF6B35" }}>
              Listed at ${srec.listPrice}
            </span>
          )}

          {/* Utility: buy button */}
          {!isOwner && srec.status === "listed" && onPurchase && (
            <button
              className="btn-primary text-sm px-3 py-1"
              onClick={onPurchase}
              disabled={isPurchasing}
            >
              {isPurchasing ? (
                <span className="flex items-center gap-1">
                  <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Burning...
                </span>
              ) : (
                "Buy & Retire →"
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
