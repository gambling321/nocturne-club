import { useState } from "react";
import { BetControls } from "../components/BetControls";
import { GameLayout } from "../components/GameLayout";
import { ResultBanner, type ResultKind } from "../components/ResultBanner";
import { SessionHistory } from "../components/SessionHistory";
import { useTokens } from "../context/TokenContext";
import { formatTokens, payoutFor, sleep } from "../lib/format";
import { secureInt } from "../lib/random";
import type { HistoryItem } from "../types";

type Pick = "Drache" | "Tiger" | "Gleichstand";
const ranks = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "B", "D", "K"];

export function DragonTiger() {
  const { balance, credit, placeBet } = useTokens();
  const [bet, setBet] = useState(10); const [pick, setPick] = useState<Pick>("Drache");
  const [cards, setCards] = useState<[string, string] | null>(null); const [dealing, setDealing] = useState(false);
  const [kind, setKind] = useState<ResultKind>("neutral"); const [message, setMessage] = useState("Setze auf die höhere Karte oder auf Gleichstand.");
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const deal = async () => {
    if (dealing || !placeBet(bet)) return;
    const dragon = secureInt(1, 13); const tiger = secureInt(1, 13); const winner: Pick = dragon === tiger ? "Gleichstand" : dragon > tiger ? "Drache" : "Tiger";
    setDealing(true); setCards(null); setKind("neutral"); setMessage("Die beiden Karten werden aufgedeckt …"); await sleep(650);
    setCards([ranks[dragon - 1]!, ranks[tiger - 1]!]); const won = pick === winner; const payout = won ? payoutFor(bet, winner === "Gleichstand" ? 10 : 2) : 0;
    if (payout) credit(payout); setKind(won ? "win" : "loss"); setMessage(won ? `${winner} gewinnt. ${formatTokens(payout)} TOKEN wurden gutgeschrieben.` : `${winner} gewinnt – dein Tipp trifft nicht.`);
    setHistory((items) => [{ id: Date.now(), title: won ? "Dragon Tiger gewonnen" : "Dragon Tiger verloren", detail: `${winner} · Tipp: ${pick}`, change: payout - bet, tone: won ? "win" as const : "loss" as const }, ...items].slice(0, 5)); setDealing(false);
  };
  return <GameLayout eyebrow="EIN KARTE · EIN DUELL" title="Dragon Tiger" description="Zwei Karten, ein Vergleich. Entscheide, welche Seite die höhere Karte erhält." rules={<ul><li>Drache und Tiger erhalten jeweils eine Karte.</li><li>Die höhere Karte gewinnt die Runde.</li><li>Drache und Tiger zahlen ×2, Gleichstand ×10 aus.</li></ul>}><div className="simple-game-table">
    <div className="duel-cards"><div><span>DRACHE</span><strong>{cards?.[0] ?? "?"}</strong></div><i>VS</i><div><span>TIGER</span><strong>{cards?.[1] ?? "?"}</strong></div></div>
    <div className="choice-row three" role="radiogroup">{(["Drache", "Gleichstand", "Tiger"] as Pick[]).map((item) => <button key={item} type="button" className={pick === item ? "selected" : ""} aria-checked={pick === item} disabled={dealing} onClick={() => setPick(item)}>{item}<small>{item === "Gleichstand" ? "×10" : "×2"}</small></button>)}</div><ResultBanner kind={kind}>{message}</ResultBanner>
    <div className="game-action-area"><BetControls bet={bet} onBetChange={setBet} balance={balance} disabled={dealing} /><button className="primary-action" type="button" disabled={dealing || balance < bet} onClick={deal}>{dealing ? "Karten kommen …" : `${formatTokens(bet)} TOKEN setzen`}</button></div><SessionHistory items={history} />
  </div></GameLayout>;
}
