import { useEffect, useState } from "react";
import { BetControls } from "../components/BetControls";
import { GameLayout } from "../components/GameLayout";
import { ResultBanner, type ResultKind } from "../components/ResultBanner";
import { SessionHistory } from "../components/SessionHistory";
import { useTokens } from "../context/TokenContext";
import { formatTokens, payoutFor, sleep } from "../lib/format";
import { secureInt, securePick } from "../lib/random";
import type { HistoryItem } from "../types";

const SLOT_SYMBOLS = [
  { id: "spark", glyph: "✦", name: "Stern", multiplier: 6 },
  { id: "gem", glyph: "◆", name: "Kristall", multiplier: 8 },
  { id: "moon", glyph: "☾", name: "Mond", multiplier: 10 },
  { id: "crown", glyph: "♛", name: "Krone", multiplier: 20 },
  { id: "orb", glyph: "●", name: "Orb", multiplier: 4 },
] as const;

type SlotSymbol = (typeof SLOT_SYMBOLS)[number];

function resultFor(reels: SlotSymbol[]) {
  const [first, second, third] = reels;
  if (first.id === second.id && second.id === third.id) {
    return { multiplier: first.multiplier, label: `Dreimal ${first.name}` };
  }
  if (first.id === second.id || second.id === third.id || first.id === third.id) {
    return { multiplier: 1.5, label: "Zwei gleiche Symbole" };
  }
  return { multiplier: 0, label: "Keine Gewinnlinie" };
}

export function Slots() {
  const { balance, credit, placeBet } = useTokens();
  const [bet, setBet] = useState(10);
  const [reels, setReels] = useState<SlotSymbol[]>([
    SLOT_SYMBOLS[0],
    SLOT_SYMBOLS[1],
    SLOT_SYMBOLS[2],
  ]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [message, setMessage] = useState("Drei Walzen, eine Gewinnlinie.");
  const [resultKind, setResultKind] = useState<ResultKind>("neutral");

  useEffect(() => {
    if (balance > 0) setBet((current) => Math.max(1, Math.min(current, balance)));
  }, [balance]);

  const addHistory = (item: Omit<HistoryItem, "id">) => {
    setHistory((current) => [
      { ...item, id: Date.now() + secureInt(1, 999) },
      ...current,
    ].slice(0, 5));
  };

  const spin = async () => {
    if (isSpinning || balance < 1 || bet > balance) return;
    const stake = bet;
    if (!placeBet(stake)) {
      setResultKind("loss");
      setMessage("Der Einsatz ist nicht mehr verfügbar.");
      return;
    }

    setIsSpinning(true);
    setResultKind("neutral");
    setMessage("Die Walzen drehen sich …");
    for (let tick = 0; tick < 5; tick += 1) {
      setReels([securePick(SLOT_SYMBOLS), securePick(SLOT_SYMBOLS), securePick(SLOT_SYMBOLS)]);
      await sleep(100);
    }

    const finalReels: SlotSymbol[] = [
      securePick(SLOT_SYMBOLS),
      securePick(SLOT_SYMBOLS),
      securePick(SLOT_SYMBOLS),
    ];
    for (let reel = 0; reel < finalReels.length; reel += 1) {
      setReels((current) => current.map((symbol, index) => (index <= reel ? finalReels[index]! : symbol)));
      await sleep(280);
    }

    const outcome = resultFor(finalReels);
    const payout = outcome.multiplier > 0 ? payoutFor(stake, outcome.multiplier) : 0;
    const net = payout - stake;
    if (payout > 0) credit(payout);

    if (payout > 0) {
      setResultKind("win");
      setMessage(`${outcome.label} · ${outcome.multiplier}× · ${formatTokens(payout)} TOKEN ausgezahlt.`);
    } else {
      setResultKind("loss");
      setMessage("Keine Gewinnlinie in dieser Runde. Versuch es mit einem neuen Einsatz.");
    }
    addHistory({
      title: payout > 0 ? "Walzengewinn" : "Walzenrunde",
      detail: `${finalReels.map((symbol) => symbol.name).join(" · ")} · ${outcome.multiplier || 0}×`,
      change: net,
      tone: payout > 0 ? "win" : "loss",
    });
    setIsSpinning(false);
  };

  return (
    <GameLayout
      eyebrow="NOCTURNE REELS"
      title="Slot Machine"
      description="Drei animierte Walzen mit einer transparenten, einzelnen Gewinnlinie."
      rules={(
        <ul>
          <li>Drei gleiche Symbole auf der mittleren Linie zahlen den angezeigten Multiplikator.</li>
          <li>Zwei gleiche Symbole zahlen 1,5× aus; alle anderen Kombinationen zahlen nicht aus.</li>
          <li>Der Einsatz wird zuerst abgezogen. Auszahlungen enthalten den Einsatz bereits.</li>
        </ul>
      )}
    >
      <div className="slots-table">
        <div className={`slot-machine ${isSpinning ? "is-spinning" : ""}`} aria-label="Drei Slot-Walzen">
          <div className="slot-machine-top"><span>NOCTURNE</span><strong>REELS</strong></div>
          <div className="slot-reels" aria-live="polite">
            {reels.map((symbol, index) => (
              <div className="slot-reel" key={`${symbol.id}-${index}`}>
                <span aria-hidden="true">{symbol.glyph}</span>
                <small>{symbol.name}</small>
              </div>
            ))}
          </div>
          <div className="slot-payline" aria-hidden="true"><span>GEWINNLINIE</span></div>
        </div>

        <ResultBanner kind={resultKind}>{message}</ResultBanner>

        <section className="slot-paytable" aria-label="Auszahlungstabelle">
          <div className="paytable-heading"><span>3 gleiche</span><span>Auszahlung</span></div>
          {SLOT_SYMBOLS.map((symbol) => (
            <div className="paytable-row" key={symbol.id}>
              <span><i aria-hidden="true">{symbol.glyph}</i> {symbol.name}</span><strong>{symbol.multiplier}×</strong>
            </div>
          ))}
          <div className="paytable-row subtle"><span>2 gleiche Symbole</span><strong>1,5×</strong></div>
        </section>

        <div className="game-action-area">
          <BetControls bet={bet} onBetChange={setBet} balance={balance} disabled={isSpinning} />
          <button className="primary-action" type="button" onClick={spin} disabled={isSpinning || balance < 1 || bet > balance}>
            {isSpinning ? "Walzen drehen …" : `${formatTokens(bet)} TOKEN · Drehen`}
          </button>
        </div>

        <SessionHistory items={history} />
      </div>
    </GameLayout>
  );
}

export default Slots;
