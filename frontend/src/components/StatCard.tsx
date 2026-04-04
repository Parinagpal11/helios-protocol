interface StatCardProps {
  label: string;
  value: string | number;
  color?: string;
}

export function StatCard({ label, value, color = "#F5A623" }: StatCardProps) {
  return (
    <div
      className="rounded-xl p-4 text-center"
      style={{ background: "#131928", border: `1px solid ${color}25` }}
    >
      <p
        className="text-2xl font-bold"
        style={{ color, fontFamily: "Georgia" }}
      >
        {value}
      </p>
      <p className="text-xs mt-1" style={{ color: "#8A96B0" }}>
        {label}
      </p>
    </div>
  );
}
