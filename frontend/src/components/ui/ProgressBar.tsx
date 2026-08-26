export default function ProgressBar({
  pct,
  tone = "green",
  height = 10,
}: {
  pct: number;
  tone?: "green" | "amber" | "red" | "teal";
  height?: number;
}) {
  const toneClass = {
    green: "bg-brand-green",
    amber: "bg-amber",
    red: "bg-danger",
    teal: "bg-teal",
  }[tone];
  return (
    <div className="w-full rounded-full overflow-hidden bg-line" style={{ height }}>
      <div
        className={`h-full rounded-full transition-all duration-700 ease-out ${toneClass}`}
        style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
      />
    </div>
  );
}
