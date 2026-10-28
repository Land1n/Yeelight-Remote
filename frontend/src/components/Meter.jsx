// Индикатор-полоса: доля значения, подпись и подпись значения.
export default function Meter({ label, value, hint, fill }) {
  const ratio = Math.min(1, Math.max(0, Number(value) || 0));
  return (
    <div className="meter">
      <div className="meter-top">
        <span>{label}</span>
        <strong>{hint}</strong>
      </div>
      <div className="meter-track">
        <span style={{ width: `${Math.round(ratio * 100)}%`, background: fill }} />
      </div>
    </div>
  );
}
