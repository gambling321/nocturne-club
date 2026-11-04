import { History } from "lucide-react";
import type { HistoryItem } from "../types";
import { formatTokens } from "../lib/format";

export function SessionHistory({ items }: { items: HistoryItem[] }) {
  return (
    <section className="history-panel" aria-live="polite">
      <div className="history-title"><History size={16} /> Diese Sitzung</div>
      {items.length === 0 ? (
        <p className="empty-history">Noch keine Runde gespielt.</p>
      ) : (
        <ul>
          {items.slice(0, 5).map((item) => (
            <li key={item.id} className={`history-item ${item.tone}`}>
              <div><strong>{item.title}</strong><span>{item.detail}</span></div>
              <b>{item.change > 0 ? "+" : ""}{formatTokens(item.change)}</b>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
