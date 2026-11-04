import { Coins, Minus, Plus } from "lucide-react";
import { TOKEN_CHIPS, formatTokens } from "../lib/format";

interface BetControlsProps {
  bet: number;
  onBetChange: (value: number) => void;
  balance: number;
  disabled?: boolean;
  label?: string;
}

export function BetControls({ bet, onBetChange, balance, disabled = false, label = "Einsatz" }: BetControlsProps) {
  const adjust = (delta: number) => onBetChange(Math.max(1, Math.min(balance, bet + delta)));
  const update = (value: string) => {
    const parsed = Number.parseInt(value.replace(/\D/g, ""), 10);
    onBetChange(Number.isFinite(parsed) ? Math.max(1, Math.min(balance, parsed)) : 1);
  };

  return (
    <div className="bet-controls">
      <div className="bet-label-row">
        <label htmlFor="bet-input"><Coins size={15} /> {label}</label>
        <span>Verfügbar: {formatTokens(balance)}</span>
      </div>
      <div className="chip-row" role="group" aria-label="Vorgegebene Einsatzwerte">
        {TOKEN_CHIPS.map((chip) => (
          <button key={chip} type="button" className={`chip ${bet === chip ? "selected" : ""}`} disabled={disabled || chip > balance} onClick={() => onBetChange(chip)}>
            {chip}
          </button>
        ))}
      </div>
      <div className="bet-input-row">
        <button type="button" className="input-stepper" disabled={disabled || bet <= 1} onClick={() => adjust(-1)} aria-label="Einsatz verringern"><Minus size={16} /></button>
        <input id="bet-input" inputMode="numeric" pattern="[0-9]*" min="1" max={Math.max(1, balance)} type="number" value={bet} disabled={disabled || balance < 1} onChange={(event) => update(event.target.value)} />
        <span className="input-suffix">TOKEN</span>
        <button type="button" className="input-stepper" disabled={disabled || bet >= balance} onClick={() => adjust(1)} aria-label="Einsatz erhöhen"><Plus size={16} /></button>
      </div>
    </div>
  );
}
