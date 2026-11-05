import { useState } from "react";
import { BetControls } from "../components/BetControls";
import { GameLayout } from "../components/GameLayout";
import { ResultBanner, type ResultKind } from "../components/ResultBanner";
import { SessionHistory } from "../components/SessionHistory";
import { useTokens } from "../context/TokenContext";
import { formatTokens, payoutFor, sleep } from "../lib/format";
import { secureInt } from "../lib/random";
import type { HistoryItem } from "../types";

type Side = "Kopf" | "Zahl";

export function CoinFlip() {
  const { balance, credit, placeBet } = useTokens();
  const [bet, setBet] = useState(10);
  const [choice, setChoice] = useState<Side>("Kopf");
  const [result, setResult] = useState<Side | null>(null);
  const [flipping, setFlipping] = useState(false);
  const [message, setMessage] = useState("Wähle Kopf oder Zahl. Jede Seite hat dieselbe Chance.");
  const [kind, setKind] = useState<ResultKind>("neutral");
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const flip = async () => {
    if (flipping || !placeBet(bet)) return;
    const landed: Side = secureInt(0, 1) ? "Kopf" : "Zahl";
    setFlipping(true); setResult(null); setKind("neutral"); setMessage("Die Münze ist in der Luft …");
    await sleep(700);
    setResult(landed);
    const won = landed === choice; const payout = won ? payoutFor(bet, 1.95) : 0;
    if (payout) credit(payout);
    setKind(won ? "win" : "loss");
    setMessage(won ? `${landed} – Treffer. ${formatTokens(payout)} TOKEN wurden gutgeschrieben.` : `${landed} – diese Runde geht nicht auf.`);
    setHistory((items) => [{ id: Date.now(), title: won ? "Coin Flip gewonnen" : "Coin Flip verloren", detail: `${choice} gewählt · ${landed} gefallen`, change: payout - bet, tone: won ? "win" as const : "loss" as const }, ...items].slice(0, 5));
    setFlipping(false);
  };

  return <GameLayout eyebrow="FIFTY / FIFTY" title="Coin Flip" description="Eine reine Entscheidung: Kopf oder Zahl, mit offenem Multiplikator und virtuellen Tokens." rules={<ul><li>Wähle vor dem Wurf Kopf oder Zahl.</li><li>Beide Seiten haben eine Gewinnchance von 50 %.</li><li>Ein Treffer zahlt den Einsatz mit ×1,95 aus.</li></ul>}><div className="simple-game-table">
    <div className={`coin-stage ${flipping ? "flipping" : ""}`}><div className="coin-face">{result ?? "N"}<small>{result ?? "NOCTURNE"}</small></div></div>
    <div className="choice-row" role="radiogroup" aria-label="Münzseite wählen">{(["Kopf", "Zahl"] as Side[]).map((side) => <button key={side} type="button" role="radio" aria-checked={choice === side} className={choice === side ? "selected" : ""} disabled={flipping} onClick={() => setChoice(side)}>{side}<small>×1,95</small></button>)}</div>
    <ResultBanner kind={kind}>{message}</ResultBanner>
    <div className="game-action-area"><BetControls bet={bet} onBetChange={setBet} balance={balance} disabled={flipping} /><button className="primary-action" type="button" disabled={flipping || balance < bet} onClick={flip}>{flipping ? "Münze fällt …" : `${formatTokens(bet)} TOKEN · werfen`}</button></div><SessionHistory items={history} />
  </div></GameLayout>;
}
