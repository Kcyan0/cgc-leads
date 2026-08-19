export default function StatCard({
  label,
  value,
  emphasis,
}: {
  label: string;
  value: number;
  /** Inverts the card (white bg, black text) to make it pop in a monochrome palette. */
  emphasis?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-5 ${
        emphasis ? "border-white bg-white" : "border-white/10 bg-white/[0.03]"
      }`}
    >
      <p
        className={`text-xs font-medium uppercase tracking-wide ${
          emphasis ? "text-black/50" : "text-white/40"
        }`}
      >
        {label}
      </p>
      <p className={`mt-2 text-3xl font-semibold ${emphasis ? "text-black" : "text-white"}`}>
        {value}
      </p>
    </div>
  );
}
