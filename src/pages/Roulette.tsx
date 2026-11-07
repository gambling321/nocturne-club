import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { BetControls } from "../components/BetControls";
import { GameLayout } from "../components/GameLayout";
import { ResultBanner, type ResultKind } from "../components/ResultBanner";
import { SessionHistory } from "../components/SessionHistory";
import { useTokens } from "../context/TokenContext";
import { formatTokens, payoutFor, sleep } from "../lib/format";
import { secureInt } from "../lib/random";
import type { HistoryItem } from "../types";

type BetSelection =
  | { kind: "number"; value: number }
  | { kind: "color"; value: "red" | "black" }
  | { kind: "parity"; value: "even" | "odd" }
  | { kind: "range"; value: "low" | "high" }
  | { kind: "dozen"; value: 1 | 2 | 3 };

const RED_NUMBERS = new Set([
  1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36,
]);

const numberGrid = [
  [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36],
  [2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35],
  [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34],
];

const rouletteOrder = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];
const rouletteStep = 360 / rouletteOrder.length;
const rouletteBackground = `conic-gradient(from -${rouletteStep / 2}deg, ${rouletteOrder.map((number, index) => `${number === 0 ? "#147247" : RED_NUMBERS.has(number) ? "#922733" : "#171c1a"} ${index * rouletteStep}deg ${(index + 1) * rouletteStep}deg`).join(",")})`;

function selectionLabel(selection: BetSelection): string {
  switch (selection.kind) {
    case "number":
      return `Zahl ${selection.value}`;
    case "color":
      return selection.value === "red" ? "Rot" : "Schwarz";
    case "parity":
      return selection.value === "even" ? "Gerade" : "Ungerade";
    case "range":
      return selection.value === "low" ? "1–18" : "19–36";
    case "dozen":
      return `${(selection.value - 1) * 12 + 1}–${selection.value * 12}`;
  }
}

function multiplierFor(selection: BetSelection): number {
  return selection.kind === "number" ? 36 : selection.kind === "dozen" ? 3 : 2;
}

function winsSelection(selection: BetSelection, winningNumber: number): boolean {
  if (winningNumber === 0) return selection.kind === "number" && selection.value === 0;

  switch (selection.kind) {
    case "number":
      return selection.value === winningNumber;
    case "color":
      return selection.value === "red"
        ? RED_NUMBERS.has(winningNumber)
        : !RED_NUMBERS.has(winningNumber);
    case "parity":
      return selection.value === "even" ? winningNumber % 2 === 0 : winningNumber % 2 === 1;
    case "range":
      return selection.value === "low" ? winningNumber <= 18 : winningNumber >= 19;
    case "dozen":
      return Math.ceil(winningNumber / 12) === selection.value;
  }
}

function numberDescription(number: number): string {
  if (number === 0) return "0 · Grün";
  return `${number} · ${RED_NUMBERS.has(number) ? "Rot" : "Schwarz"}`;
}

export function Roulette() {
  const { balance, credit, placeBet } = useTokens();
  const [bet, setBet] = useState(10);
  const [selection, setSelection] = useState<BetSelection>({ kind: "color", value: "red" });
  const [isSpinning, setIsSpinning] = useState(false);
  const [winningNumber, setWinningNumber] = useState<number | null>(null);
  const [wheelDegrees, setWheelDegrees] = useState(0);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [message, setMessage] = useState("Wähle ein Feld und starte das Rad.");
  const [resultKind, setResultKind] = useState<ResultKind>("neutral");

  useEffect(() => {
    if (balance > 0) setBet((current) => Math.max(1, Math.min(current, balance)));
  }, [balance]);

  const selectedLabel = useMemo(() => selectionLabel(selection), [selection]);
  const selectedMultiplier = useMemo(() => multiplierFor(selection), [selection]);

  const addHistory = (item: Omit<HistoryItem, "id">) => {
    setHistory((current) => [
      { ...item, id: Date.now() + secureInt(1, 999) },
      ...current,
    ].slice(0, 5));
  };

  const spin = async () => {
    if (isSpinning || balance < 1 || bet > balance) return;

    const stake = bet;
    const placed = placeBet(stake);
    if (!placed) {
      setResultKind("loss");
      setMessage("Der Einsatz ist nicht mehr verfügbar.");
      return;
    }

    const landedOn = secureInt(0, 36);
    setIsSpinning(true);
    setResultKind("neutral");
    setMessage("Das Rad dreht sich …");
    setWinningNumber(null);
    const pocketIndex = rouletteOrder.indexOf(landedOn);
    setWheelDegrees((current) => {
      const normalized = ((current % 360) + 360) % 360;
      const desired = (360 - pocketIndex * (360 / rouletteOrder.length)) % 360;
      const alignment = ((desired - normalized) % 360 + 360) % 360;
      return current + 1800 + alignment;
    });
    await sleep(5200);

    const won = winsSelection(selection, landedOn);
    const payout = won ? payoutFor(stake, selectedMultiplier) : 0;
    const net = payout - stake;
    setWinningNumber(landedOn);

    if (payout > 0) credit(payout);

    if (won) {
      setResultKind("win");
      setMessage(`${numberDescription(landedOn)} gewinnt. ${selectedLabel}: Auszahlung ${formatTokens(payout)} TOKEN.`);
    } else {
      setResultKind("loss");
      setMessage(`${numberDescription(landedOn)}. ${selectedLabel} gewinnt diese Runde nicht.`);
    }
    addHistory({
      title: won ? "Roulette gewonnen" : "Roulette verloren",
      detail: `${selectedLabel} · Ergebnis ${landedOn} · ${selectedMultiplier}×`,
      change: net,
      tone: won ? "win" : "loss",
    });
    setIsSpinning(false);
  };

  const choose = (next: BetSelection) => {
    if (!isSpinning) setSelection(next);
  };

  return (
    <GameLayout
      eyebrow="EUROPÄISCHES ROULETTE"
      title="Roulette Salon"
      description="Eine Null, klare Quoten und ein elegantes Rad für deine private Game Night."
      rules={(
        <ul>
          <li>Das Rad enthält die Zahlen 0 bis 36; die 0 ist grün.</li>
          <li>Einzelzahlen zahlen 36× aus, Dutzende 3×, einfache Chancen 2×.</li>
          <li>Der Einsatz wird vor dem Dreh abgezogen; die Auszahlung enthält den Einsatz.</li>
        </ul>
      )}
    >
      <div className="roulette-table">
        <div className="roulette-stage">
          <div className="roulette-pointer" aria-hidden="true">◆</div>
          <div
            className={`roulette-wheel ${isSpinning ? "spinning" : ""}`}
            style={{ transform: `rotate(${wheelDegrees}deg)`, background: rouletteBackground }}
            aria-label={isSpinning ? "Rouletterad dreht sich" : "Rouletterad"}
          >
            {rouletteOrder.map((number, index) => {
              const angle = index * rouletteStep;
              return <span key={number} className={`roulette-pocket ${number === 0 ? "green" : RED_NUMBERS.has(number) ? "red" : "black"}`} style={{ "--pocket-angle": `${angle}deg`, "--counter-angle": `${-angle}deg` } as CSSProperties}>{number}</span>;
            })}
            <div className="roulette-wheel-inner">
              <span>{winningNumber ?? "✦"}</span>
              <small>{winningNumber === null ? "NOCTURNE" : numberDescription(winningNumber)}</small>
            </div>
          </div>
          <div className="roulette-result-number" aria-live="polite">
            {winningNumber === null ? "Bereit" : numberDescription(winningNumber)}
          </div>
        </div>

        <ResultBanner kind={resultKind}>{message}</ResultBanner>

        <div className="roulette-bet-board" aria-label="Roulette-Einsatzfeld">
          <div className="roulette-number-grid">
            <button
              type="button"
              disabled={isSpinning}
              className={`roulette-number zero ${selection.kind === "number" && selection.value === 0 ? "selected" : ""}`}
              onClick={() => choose({ kind: "number", value: 0 })}
            >
              0
            </button>
            <div className="roulette-number-columns">
              {numberGrid.map((row, rowIndex) => (
                <div className="roulette-number-row" key={rowIndex}>
                  {row.map((number) => (
                    <button
                      key={number}
                      type="button"
                      disabled={isSpinning}
                      className={`roulette-number ${RED_NUMBERS.has(number) ? "red" : "black"} ${selection.kind === "number" && selection.value === number ? "selected" : ""}`}
                      onClick={() => choose({ kind: "number", value: number })}
                    >
                      {number}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>
          <div className="roulette-outside-bets">
            <button type="button" disabled={isSpinning} className={selection.kind === "range" && selection.value === "low" ? "selected" : ""} onClick={() => choose({ kind: "range", value: "low" })}>1–18</button>
            <button type="button" disabled={isSpinning} className={selection.kind === "parity" && selection.value === "even" ? "selected" : ""} onClick={() => choose({ kind: "parity", value: "even" })}>Gerade</button>
            <button type="button" disabled={isSpinning} className={`red ${selection.kind === "color" && selection.value === "red" ? "selected" : ""}`} onClick={() => choose({ kind: "color", value: "red" })}>Rot</button>
            <button type="button" disabled={isSpinning} className={`black ${selection.kind === "color" && selection.value === "black" ? "selected" : ""}`} onClick={() => choose({ kind: "color", value: "black" })}>Schwarz</button>
            <button type="button" disabled={isSpinning} className={selection.kind === "parity" && selection.value === "odd" ? "selected" : ""} onClick={() => choose({ kind: "parity", value: "odd" })}>Ungerade</button>
            <button type="button" disabled={isSpinning} className={selection.kind === "range" && selection.value === "high" ? "selected" : ""} onClick={() => choose({ kind: "range", value: "high" })}>19–36</button>
            {[1, 2, 3].map((dozen) => (
              <button key={dozen} type="button" disabled={isSpinning} className={selection.kind === "dozen" && selection.value === dozen ? "selected" : ""} onClick={() => choose({ kind: "dozen", value: dozen as 1 | 2 | 3 })}>
                {dozen === 1 ? "1–12" : dozen === 2 ? "13–24" : "25–36"}
              </button>
            ))}
          </div>
        </div>

        <div className="game-action-area">
          <BetControls bet={bet} onBetChange={setBet} balance={balance} disabled={isSpinning} />
          <div className="selected-bet-summary">
            <span>Aktives Feld</span>
            <strong>{selectedLabel}</strong>
            <small>Auszahlung: {selectedMultiplier}×</small>
          </div>
          <button className="primary-action" type="button" onClick={spin} disabled={isSpinning || balance < 1 || bet > balance}>
            {isSpinning ? "Rad dreht …" : `${formatTokens(bet)} TOKEN setzen & drehen`}
          </button>
        </div>

        <SessionHistory items={history} />
      </div>
    </GameLayout>
  );
}

export default Roulette;
