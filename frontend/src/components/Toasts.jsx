import { useNotices } from "../notify.js";

const ICON = { info: "›", ok: "✓", warn: "!", error: "✕" };

// Стек уведомлений: что ушло агенту и чем это закончилось.
export default function Toasts() {
  const { toasts, dismiss } = useNotices();
  if (!toasts.length) {
    return null;
  }
  return (
    <div className="toasts" role="status" aria-live="polite">
      {toasts.map((item) => (
        <div className={`toast toast-${item.kind}`} key={item.id}>
          <span className="toast-icon">{ICON[item.kind] ?? ICON.info}</span>
          <span className="toast-text">
            {item.text}
            <em>{item.time}</em>
          </span>
          <button className="toast-close" type="button" aria-label="Закрыть" onClick={() => dismiss(item.id)}>
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
