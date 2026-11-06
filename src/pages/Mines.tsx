import { useState } from "react";
import { BetControls } from "../components/BetControls";
import { GameLayout } from "../components/GameLayout";
import { ResultBanner, type ResultKind } from "../components/ResultBanner";
import { SessionHistory } from "../components/SessionHistory";
import { useTokens } from "../context/TokenContext";
import { formatTokens, payoutFor } from "../lib/format";
import { secureInt } from "../lib/random";
import type { HistoryItem } from "../types";

const cells = Array.from({ length: 25 }, (_, index) => index);
function multiplier(safe: number, mines: number) { return Math.max(1, Number((1 + safe * (mines / 25) * 1.45).toFixed(2))); }

export function Mines() {
  const { balance, credit, placeBet } = useTokens(); const [bet, setBet] = useState(10); const [mineCount, setMineCount] = useState(3);
  const [mines, setMines] = useState<Set<number> | null>(null); const [opened, setOpened] = useState<Set<number>>(new Set()); const [active, setActive] = useState(false);
  const [kind, setKind] = useState<ResultKind>("neutral"); const [message, setMessage] = useState("Wähle deinen Einsatz und öffne ein Feld."); const [history, setHistory] = useState<HistoryItem[]>([]);
  const start = () => { if (!placeBet(bet)) return; const next = new Set<number>(); while (next.size < mineCount) next.add(secureInt(0, 24)); setMines(next); setOpened(new Set()); setActive(true); setKind("neutral"); setMessage("Das Feld ist vorbereitet. Öffne Edelsteine und zahle rechtzeitig aus."); };
  const reveal = (cell: number) => { if (!active || !mines || opened.has(cell)) return; if (mines.has(cell)) { setOpened(new Set(cells)); setActive(false); setKind("loss"); setMessage("Eine Mine – diese Runde endet ohne Auszahlung."); setHistory((items) => [{ id: Date.now(), title: "Mines verloren", detail: `${opened.size} sichere Felder geöffnet`, change: -bet, tone: "loss" as const }, ...items].slice(0, 5)); return; } const next = new Set(opened).add(cell); setOpened(next); setKind("neutral"); setMessage(`${next.size} sichere Felder. Aktueller Wert: ×${multiplier(next.size, mineCount).toFixed(2)}.`); };
  const cashout = () => { if (!active || !opened.size) return; const payout = payoutFor(bet, multiplier(opened.size, mineCount)); credit(payout); setActive(false); setKind("win"); setMessage(`${formatTokens(payout)} TOKEN wurden ausgezahlt.`); setHistory((items) => [{ id: Date.now(), title: "Mines ausgezahlt", detail: `${opened.size} sichere Felder · ×${multiplier(opened.size, mineCount).toFixed(2)}`, change: payout - bet, tone: "win" as const }, ...items].slice(0, 5)); };
  return <GameLayout eyebrow="25 FELDER" title="Mines" description="Öffne sichere Felder, erhöhe deinen Rundenwert und zahle aus, bevor du eine Mine triffst." rules={<ul><li>Lege die Anzahl der Minen vor dem Start fest.</li><li>Jeder Edelstein erhöht den sichtbaren Rundenwert.</li><li>Bei einer Mine endet die Runde; du kannst vorher auszahlen.</li></ul>}><div className="simple-game-table"><div className="mines-toolbar"><label>Minen <select value={mineCount} disabled={active} onChange={(event) => setMineCount(Number(event.target.value))}>{[3, 5, 7].map((value) => <option key={value}>{value}</option>)}</select></label><strong>{active ? `×${multiplier(opened.size, mineCount).toFixed(2)}` : "Bereit"}</strong></div><div className="mines-grid">{cells.map((cell) => { const hit = opened.has(cell); const isMine = mines?.has(cell); return <button key={cell} type="button" disabled={!active || hit} onClick={() => reveal(cell)} className={hit ? (isMine ? "mine" : "gem") : ""}>{hit ? (isMine ? "💣" : "💎") : ""}</button>; })}</div><ResultBanner kind={kind}>{message}</ResultBanner><div className="game-action-area"><BetControls bet={bet} onBetChange={setBet} balance={balance} disabled={active}/>{active ? <button className="primary-action" type="button" onClick={cashout} disabled={!opened.size}>{formatTokens(payoutFor(bet, multiplier(opened.size, mineCount)))} TOKEN · auszahlen</button> : <button className="primary-action" type="button" onClick={start} disabled={balance < bet}>{formatTokens(bet)} TOKEN · beginnen</button>}</div><SessionHistory items={history}/></div></GameLayout>;
}
