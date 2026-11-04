import { useEffect, useMemo, useState } from "react";
import { BetControls } from "../components/BetControls";
import { GameLayout } from "../components/GameLayout";
import { ResultBanner, type ResultKind } from "../components/ResultBanner";
import { SessionHistory } from "../components/SessionHistory";
import { useTokens } from "../context/TokenContext";
import { formatTokens, payoutFor, sleep } from "../lib/format";
import { secureInt } from "../lib/random";
import type { HistoryItem } from "../types";

type Direction = "over" | "under";

function clampTarget(value: number): number {
  if (!Number.isFinite(value)) return 50;
  return Math.max(2, Math.min(98, Math.floor(value)));
}

export function Dice() {
  const { balance, credit, placeBet } = useTokens();
  const [bet, setBet] = useState(10);
  const [direction, setDirection] = useState<Direction>("over");
  const [target, setTarget] = useState(50);
  const [rolled, setRolled] = useState<number | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [message, setMessage] = useState("Wähle Ziel und Richtung für deinen Wurf.");
  const [resultKind, setResultKind] = useState<ResultKind>("neutral");

  const chance = useMemo(
    () => (direction === "over" ? 100 - target : target - 1),
    [direction, target],
  );
  const multiplier = useMemo(() => 100 / chance, [chance]);

  useEffect(() => {
    if (balance > 0) setBet((current) => Math.max(1, Math.min(current, balance)));
  }, [balance]);

  const addHistory = (item: Omit<HistoryItem, "id">) => {
    setHistory((current) => [
      { ...item, id: Date.now() + secureInt(1, 999) },
      ...current,
    ].slice(0, 5));
  };

  const roll = async () => {
    if (isRolling || balance < 1 || bet > balance) return;
    const stake = bet;
    if (!placeBet(stake)) {
      setResultKind("loss");
      setMessage("Der Einsatz ist nicht mehr verfügbar.");
      return;
    }

    const winningRoll = secureInt(1, 100);
    setIsRolling(true);
    setResultKind("neutral");
    setMessage("Der Würfel rollt …");
    for (let frame = 0; frame < 7; frame += 1) {
      setRolled(secureInt(1, 100));
      await sleep(105);
    }
    setRolled(winningRoll);

    const won = direction === "over" ? winningRoll > target : winningRoll < target;
    const payout = won ? payoutFor(stake, multiplier) : 0;
    const net = payout - stake;
    const condition = direction === "over" ? `über ${target}` : `unter ${target}`;
    if (payout > 0) credit(payout);

    if (won) {
      setResultKind("win");
      setMessage(`${winningRoll} ist ${condition}. ${formatTokens(payout)} TOKEN ausgezahlt.`);
    } else {
      setResultKind("loss");
      setMessage(`${winningRoll} ist nicht ${condition}. Diese Runde gewinnt nicht.`);
    }
    addHistory({
      title: won ? "Würfelwurf gewonnen" : "Würfelwurf verloren",
      detail: `${winningRoll} · ${direction === "over" ? ">" : "<"} ${target} · ${multiplier.toFixed(2)}×`,
      change: net,
      tone: won ? "win" : "loss",
    });
    setIsRolling(false);
  };

  return (
    <GameLayout
      eyebrow="OVER / UNDER"
      title="Dice"
      description="Ein klarer 1-bis-100-Wurf: Mehr Risiko bedeutet einen höheren sichtbaren Multiplikator."
      rules={(
        <ul>
          <li>Bei „Über“ muss das Ergebnis größer als dein Ziel sein; bei „Unter“ kleiner.</li>
          <li>Die Gewinnchance und der Multiplikator aktualisieren sich vor jedem Wurf.</li>
          <li>Die Auszahlung enthält den Einsatz und wird auf ganze Tokens abgerundet.</li>
        </ul>
      )}
    >
      <div className="dice-table">
        <section className={`dice-display ${isRolling ? "is-rolling" : ""}`} aria-label="Würfelergebnis">
          <span className="dice-display-label">ERGEBNIS</span>
          <strong aria-live="polite">{rolled ?? "—"}</strong>
          <span className="dice-range">1 — 100</span>
        </section>

        <ResultBanner kind={resultKind}>{message}</ResultBanner>

        <section className="dice-settings" aria-label="Wurf-Einstellungen">
          <div className="direction-toggle" role="group" aria-label="Gewinnrichtung">
            <button type="button" className={direction === "under" ? "selected" : ""} onClick={() => setDirection("under")} disabled={isRolling}>Unter</button>
            <button type="button" className={direction === "over" ? "selected" : ""} onClick={() => setDirection("over")} disabled={isRolling}>Über</button>
          </div>
          <div className="target-control">
            <label htmlFor="dice-target">Zielwert</label>
            <div className="target-input-row">
              <input
                id="dice-target"
                type="range"
                min="2"
                max="98"
                value={target}
                onChange={(event) => setTarget(clampTarget(Number(event.target.value)))}
                disabled={isRolling}
              />
              <input
                aria-label="Zielwert als Zahl"
                type="number"
                min="2"
                max="98"
                value={target}
                onChange={(event) => setTarget(clampTarget(Number(event.target.value)))}
                disabled={isRolling}
              />
            </div>
          </div>
          <div className="dice-odds" aria-live="polite">
            <div><span>Gewinnchance</span><strong>{chance}%</strong></div>
            <div><span>Multiplikator</span><strong>{multiplier.toFixed(2)}×</strong></div>
          </div>
        </section>

        <div className="game-action-area">
          <BetControls bet={bet} onBetChange={setBet} balance={balance} disabled={isRolling} />
          <button className="primary-action" type="button" onClick={roll} disabled={isRolling || balance < 1 || bet > balance}>
            {isRolling ? "Würfel rollt …" : `${formatTokens(bet)} TOKEN · Würfeln`}
          </button>
        </div>

        <SessionHistory items={history} />
      </div>
    </GameLayout>
  );
}

export default Dice;
