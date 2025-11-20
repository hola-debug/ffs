export const StatItem = ({ label, value, hint }: { label: string; value: string; hint?: string }) => (
  <div className="rounded-[18px] border border-white/10 bg-black/30 px-3 py-2">
    <p className="text-[9px] uppercase tracking-[0.3em] text-white/60">{label}</p>
    <p className="text-[14px] font-semibold text-white">{value}</p>
    {hint && <p className="text-[9px] text-white/50">{hint}</p>}
  </div>
);
