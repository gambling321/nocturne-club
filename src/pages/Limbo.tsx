import { useMemo, useState } from "react";
import { BetControls } from "../components/BetControls";
import { GameLayout } from "../components/GameLayout";
import { ResultBanner, type ResultKind } from "../components/ResultBanner";
import { SessionHistory } from "../components/SessionHistory";
import { useTokens } from "../context/TokenContext";
import { formatTokens, payoutFor, sleep } from "../lib/format";
import { secureInt } from "../lib/random";
import type { HistoryItem } from "../types";

export function Limbo() {
  const { balance, credit, placeBet } = useTokens(); const [bet, setBet] = useState(10); const [target, setTarget] = useState(2);
  const [rolled, setRolled] = useState<number | null>(null); const [running, setRunning] = useState(false); const [kind, setKind] = useState<ResultKind>("neutral");
  const [message, setMessage] = useState("Lege deinen Ziel-Multiplikator fest und springe darüber."); const [history, setHistory] = useState<HistoryItem[]>([]);
  const chance = useMemo(() => Math.min(95, 96 / target), [target]);
  const play = async () => { if (running || !placeBet(bet)) return; const value = secureInt(100, 1200) / 100; setRunning(true); setRolled(null); setKind("neutral"); setMessage("Der Limbo-Wert wird gezogen …"); await sleep(600); setRolled(value); const won = value >= target; const payout = won ? payoutFor(bet, target * .96) : 0; if (payout) credit(payout); setKind(won ? "win" : "loss"); setMessage(won ? `×${value.toFixed(2)} liegt über deinem Ziel. ${formatTokens(payout)} TOKEN ausgezahlt.` : `×${value.toFixed(2)} liegt unter deinem Ziel von ×${target.toFixed(2)}.`); setHistory((items) => [{ id: Date.now(), title: won ? "Limbo gewonnen" : "Limbo verloren", detail: `Ziel ×${target.toFixed(2)} · Ergebnis ×${value.toFixed(2)}`, change: payout - bet, tone: won ? "win" as const : "loss" as const }, ...items].slice(0, 5)); setRunning(false); };
  return <GameLayout eyebrow="SETZE DEIN ZIEL" title="Limbo" description="Ein Ziel-Multiplikator, ein Ergebnis: Landet der Wert darüber, wird deine Runde ausgezahlt." rules={<ul><li>Wähle vor der Runde deinen Ziel-Multiplikator.</li><li>Das Ergebnis muss mindestens so hoch wie dein Ziel sein.</li><li>Höhere Ziele bedeuten eine geringere sichtbare Gewinnchance.</li></ul>}><div className="simple-game-table"><div className="limbo-display"><span>ERGEBNIS</span><strong>{rolled ? `×${rolled.toFixed(2)}` : "×—"}</strong></div><section className="target-control limbo-control"><label htmlFor="limbo-target">Ziel: <b>×{target.toFixed(2)}</b></label><input id="limbo-target" type="range" min="1.1" max="10" step=".1" value={target} disabled={running} onChange={(event) => setTarget(Number(event.target.value))}/><div><span>Gewinnchance: {chance.toFixed(1)} %</span><span>Auszahlung: ×{(target * .96).toFixed(2)}</span></div></section><ResultBanner kind={kind}>{message}</ResultBanner><div className="game-action-area"><BetControls bet={bet} onBetChange={setBet} balance={balance} disabled={running}/><button className="primary-action" type="button" onClick={play} disabled={running || balance < bet}>{running ? "Limbo läuft …" : `${formatTokens(bet)} TOKEN · springen`}</button></div><SessionHistory items={history}/></div></GameLayout>;
}
