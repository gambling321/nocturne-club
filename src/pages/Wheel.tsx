import { useRef, useState } from "react";
import { BetControls } from "../components/BetControls";
import { GameLayout } from "../components/GameLayout";
import { ResultBanner, type ResultKind } from "../components/ResultBanner";
import { SessionHistory } from "../components/SessionHistory";
import { useTokens } from "../context/TokenContext";
import { formatTokens, payoutFor, sleep } from "../lib/format";
import { secureInt } from "../lib/random";
import type { HistoryItem } from "../types";

const SEGMENTS = [
  { multiplier: 0, color: "#342044" },
  { multiplier: 0, color: "#1c4555" },
  { multiplier: 0.25, color: "#87592a" },
  { multiplier: 0.5, color: "#5f3a92" },
  { multiplier: 0.5, color: "#166d67" },
  { multiplier: 0.75, color: "#a16d31" },
  { multiplier: 0.75, color: "#4c2e75" },
  { multiplier: 1, color: "#187c72" },
  { multiplier: 1, color: "#9a682d" },
  { multiplier: 1.25, color: "#633b98" },
  { multiplier: 1.75, color: "#168d7e" },
  { multiplier: 3, color: "#d09a45" },
] as const;

const WHEEL_SIZE = 300;
const CENTER = WHEEL_SIZE / 2;
const RADIUS = 140;
const SLICE = 360 / SEGMENTS.length;

function pointAt(angle: number, radius: number) {
  const radians = ((angle - 90) * Math.PI) / 180;
  return { x: CENTER + radius * Math.cos(radians), y: CENTER + radius * Math.sin(radians) };
}

function wedgePath(index: number): string {
  const start = pointAt(index * SLICE, RADIUS);
  const end = pointAt((index + 1) * SLICE, RADIUS);
  return `M ${CENTER} ${CENTER} L ${start.x} ${start.y} A ${RADIUS} ${RADIUS} 0 0 1 ${end.x} ${end.y} Z`;
}

function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function Wheel() {
  const { balance, placeBet, credit } = useTokens();
  const [bet, setBet] = useState(10);
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [winner, setWinner] = useState<number | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [feedback, setFeedback] = useState<{ kind: ResultKind; message: string }>({
    kind: "neutral",
    message: "Setze deinen Einsatz und drehe das Lucky Wheel.",
  });
  const historyId = useRef(0);

  const pushHistory = (item: Omit<HistoryItem, "id">) => {
    historyId.current += 1;
    setHistory((items) => [{ id: historyId.current, ...item }, ...items].slice(0, 5));
  };

  const updateBet = (value: number) => {
    setBet(Math.max(1, Math.min(Math.max(1, balance), Math.floor(value) || 1)));
  };

  const spin = async () => {
    if (isSpinning) return;
    if (bet > balance || !placeBet(bet)) {
      setFeedback({ kind: "loss", message: "Für diesen Einsatz sind nicht genug Tokens verfügbar." });
      return;
    }

    const winnerIndex = secureInt(0, SEGMENTS.length - 1);
    const selected = SEGMENTS[winnerIndex]!;
    const desiredRotation = -(winnerIndex * SLICE + SLICE / 2);
    const currentRotation = ((rotation % 360) + 360) % 360;
    const delta = ((desiredRotation - currentRotation) % 360 + 360) % 360;
    setWinner(null);
    setRotation(rotation + 1440 + delta);
    setIsSpinning(true);
    setFeedback({ kind: "neutral", message: "Das Rad dreht sich …" });
    await sleep(prefersReducedMotion() ? 100 : 5200);

    const payout = payoutFor(bet, selected.multiplier);
    if (payout > 0) credit(payout);
    const change = payout - bet;
    const kind: ResultKind = change > 0 ? "win" : change < 0 ? "loss" : "neutral";
    setWinner(winnerIndex);
    pushHistory({
      title: "Lucky Wheel",
      detail: `×${selected.multiplier.toFixed(selected.multiplier % 1 === 0 ? 0 : 2)} gedreht.`,
      change,
      tone: kind,
    });
    setFeedback({
      kind,
      message: payout > 0
        ? `×${selected.multiplier.toFixed(selected.multiplier % 1 === 0 ? 0 : 2)}: ${formatTokens(payout)} TOKEN Auszahlung.`
        : "×0 gedreht. Diese Runde endet ohne Auszahlung.",
    });
    setIsSpinning(false);
  };

  return (
    <GameLayout
      eyebrow="SIGNATURE SPIN · 08"
      title="Lucky Wheel"
      description="Ein elegantes Glücksrad mit offen sichtbaren Multiplikatoren und einer klaren Auszahlung pro Drehung."
      rules={(
        <ul>
          <li>Der Einsatz wird vor dem Drehen reserviert.</li>
          <li>Der Zeiger bestimmt den getroffenen Multiplikator.</li>
          <li>Auszahlung = Einsatz × Multiplikator.</li>
          <li>×0 bedeutet keine Auszahlung, ×1 gibt deinen Einsatz zurück.</li>
        </ul>
      )}
    >
      <div className="wheel-table game-table-inner">
        <div className="wheel-stage" aria-label="Lucky Wheel">
          <span className="wheel-pointer" aria-hidden="true" />
          <svg
            className={`lucky-wheel ${isSpinning ? "spinning" : ""}`}
            viewBox={`0 0 ${WHEEL_SIZE} ${WHEEL_SIZE}`}
            role="img"
            aria-label={winner === null ? "Noch kein Feld getroffen" : `Getroffen: Multiplikator ${SEGMENTS[winner]!.multiplier}`}
            style={{ transform: `rotate(${rotation}deg)` }}
          >
            {SEGMENTS.map((segment, index) => {
              const labelPoint = pointAt(index * SLICE + SLICE / 2, 100);
              return (
                <g key={index} className={winner === index && !isSpinning ? "wheel-segment active" : "wheel-segment"}>
                  <path d={wedgePath(index)} fill={segment.color} />
                  <text x={labelPoint.x} y={labelPoint.y + 5} textAnchor="middle">×{segment.multiplier.toFixed(segment.multiplier % 1 === 0 ? 0 : 2)}</text>
                </g>
              );
            })}
            <circle cx={CENTER} cy={CENTER} r="32" className="wheel-hub" />
            <text x={CENTER} y={CENTER + 5} textAnchor="middle" className="wheel-hub-label">SPIN</text>
          </svg>
        </div>

        <div className="wheel-legend" aria-label="Multiplikatoren auf dem Glücksrad">
          {SEGMENTS.map((segment, index) => (
            <span key={index} className={winner === index && !isSpinning ? "active" : ""}>
              <i style={{ backgroundColor: segment.color }} aria-hidden="true" /> ×{segment.multiplier.toFixed(segment.multiplier % 1 === 0 ? 0 : 2)}
            </span>
          ))}
        </div>

        <ResultBanner kind={feedback.kind}>{feedback.message}</ResultBanner>

        <div className="game-controls">
          <BetControls bet={bet} onBetChange={updateBet} balance={balance} disabled={isSpinning} />
          <button type="button" className="game-action primary full-width" disabled={isSpinning || balance < 1} onClick={() => void spin()}>
            {isSpinning ? "Rad dreht sich …" : `${formatTokens(bet)} TOKEN drehen`}
          </button>
        </div>

        <SessionHistory items={history} />
      </div>
    </GameLayout>
  );
}
