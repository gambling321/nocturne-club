import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { BetControls } from "../components/BetControls";
import { GameLayout } from "../components/GameLayout";
import { ResultBanner, type ResultKind } from "../components/ResultBanner";
import { SessionHistory } from "../components/SessionHistory";
import { useTokens } from "../context/TokenContext";
import { formatTokens, payoutFor, sleep } from "../lib/format";
import { secureInt } from "../lib/random";
import type { HistoryItem } from "../types";

const PLINKO_TABLES = {
  niedrig: [0.3, 0.5, 0.75, 0.9, 1.1, 1.35, 1.5, 1.35, 1.1, 0.9, 0.75, 0.5, 0.3],
  mittel: [0.1, 0.2, 0.45, 0.8, 1.15, 1.7, 3.2, 1.7, 1.15, 0.8, 0.45, 0.2, 0.1],
  hoch: [0, 0.1, 0.25, 0.5, 0.9, 1.9, 5, 1.9, 0.9, 0.5, 0.25, 0.1, 0],
} as const;

type Risk = keyof typeof PLINKO_TABLES;

const RISK_COPY: Record<Risk, { label: string; description: string }> = {
  niedrig: { label: "Niedrig", description: "Ausgeglichenere Felder, kleinerer Hauptgewinn." },
  mittel: { label: "Mittel", description: "Der klassische Mix aus kleinen und großen Multiplikatoren." },
  hoch: { label: "Hoch", description: "Große Ausschläge und ein seltener Spitzenwert." },
};

function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function Plinko() {
  const { balance, placeBet, credit } = useTokens();
  const [bet, setBet] = useState(10);
  const [risk, setRisk] = useState<Risk>("mittel");
  const [isDropping, setIsDropping] = useState(false);
  const [landingIndex, setLandingIndex] = useState<number | null>(null);
  const [dropId, setDropId] = useState(0);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [feedback, setFeedback] = useState<{ kind: ResultKind; message: string }>({
    kind: "neutral",
    message: "Wähle Risiko und Einsatz, dann lasse den Ball fallen.",
  });
  const historyId = useRef(0);

  const multipliers = PLINKO_TABLES[risk];

  const pushHistory = (item: Omit<HistoryItem, "id">) => {
    historyId.current += 1;
    setHistory((items) => [{ id: historyId.current, ...item }, ...items].slice(0, 5));
  };

  const updateBet = (value: number) => {
    setBet(Math.max(1, Math.min(Math.max(1, balance), Math.floor(value) || 1)));
  };

  const drop = async () => {
    if (isDropping) return;
    if (bet > balance || !placeBet(bet)) {
      setFeedback({ kind: "loss", message: "Für diesen Einsatz sind nicht genug Tokens verfügbar." });
      return;
    }

    const index = secureInt(0, multipliers.length - 1);
    const multiplier = multipliers[index]!;
    setLandingIndex(index);
    setDropId((value) => value + 1);
    setIsDropping(true);
    setFeedback({ kind: "neutral", message: "Der Ball findet seinen Weg durch das Pegboard …" });
    await sleep(prefersReducedMotion() ? 100 : 1250);

    const payout = payoutFor(bet, multiplier);
    if (payout > 0) credit(payout);
    const change = payout - bet;
    const kind: ResultKind = change > 0 ? "win" : change < 0 ? "loss" : "neutral";
    pushHistory({
      title: `Plinko · ${RISK_COPY[risk].label}`,
      detail: `Feld ${index + 1} mit ×${multiplier.toFixed(2)}.`,
      change,
      tone: kind,
    });
    setFeedback({
      kind,
      message: payout > 0
        ? `×${multiplier.toFixed(2)} getroffen: ${formatTokens(payout)} TOKEN Auszahlung.`
        : "Kein Multiplikator getroffen. Diese Runde endet ohne Auszahlung.",
    });
    setIsDropping(false);
  };

  const landingPosition = landingIndex === null ? 50 : ((landingIndex + 0.5) / multipliers.length) * 100;

  return (
    <GameLayout
      eyebrow="PEGBOARD · 06"
      title="Plinko"
      description="Ein Ball, ein Pegboard und sichtbare Multiplikatoren. Du bestimmst, wie volatil die Runde sein soll."
      rules={(
        <ul>
          <li>Wähle vor dem Fall ein Risikoprofil und deinen Einsatz.</li>
          <li>Der Ball landet in einem der unten sichtbaren Multiplikator-Felder.</li>
          <li>Deine Auszahlung ist Einsatz × getroffener Multiplikator.</li>
          <li>Bei ×0 endet die Runde ohne Auszahlung.</li>
        </ul>
      )}
    >
      <div className="plinko-table game-table-inner">
        <div className="risk-selector" role="radiogroup" aria-label="Plinko Risikostufe">
          {(Object.keys(PLINKO_TABLES) as Risk[]).map((level) => (
            <button
              key={level}
              type="button"
              role="radio"
              aria-checked={risk === level}
              disabled={isDropping}
              className={`risk-option ${risk === level ? "selected" : ""}`}
              onClick={() => setRisk(level)}
            >
              <strong>{RISK_COPY[level].label}</strong>
              <span>{RISK_COPY[level].description}</span>
            </button>
          ))}
        </div>

        <div className="plinko-board" aria-label="Plinko Feld mit Multiplikatoren">
          <div className="plinko-pegs" aria-hidden="true">
            {Array.from({ length: 8 }, (_, row) => (
              <div className="plinko-peg-row" key={row}>
                {Array.from({ length: row + 3 }, (_, column) => <i className="plinko-peg" key={column} />)}
              </div>
            ))}
          </div>
          <motion.div
            key={dropId}
            className="plinko-ball"
            initial={{ left: "50%", top: "4%", opacity: isDropping ? 1 : 0 }}
            animate={isDropping ? { left: `${landingPosition}%`, top: "75%", opacity: 1 } : { left: `${landingPosition}%`, top: "75%", opacity: 0 }}
            transition={{ duration: prefersReducedMotion() ? 0.01 : 1.15, ease: "easeInOut" }}
            aria-hidden="true"
          />
          <div className="plinko-multipliers">
            {multipliers.map((multiplier, index) => (
              <span key={`${risk}-${index}`} className={landingIndex === index && !isDropping ? "landed" : ""}>
                ×{multiplier.toFixed(multiplier % 1 === 0 ? 0 : 2)}
              </span>
            ))}
          </div>
        </div>

        <ResultBanner kind={feedback.kind}>{feedback.message}</ResultBanner>

        <div className="game-controls">
          <BetControls bet={bet} onBetChange={updateBet} balance={balance} disabled={isDropping} />
          <button type="button" className="game-action primary full-width" disabled={isDropping || balance < 1} onClick={() => void drop()}>
            {isDropping ? "Ball fällt …" : `${formatTokens(bet)} TOKEN fallen lassen`}
          </button>
        </div>

        <SessionHistory items={history} />
      </div>
    </GameLayout>
  );
}
