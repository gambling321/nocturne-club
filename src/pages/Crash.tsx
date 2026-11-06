import { useEffect, useRef, useState } from "react";
import { BetControls } from "../components/BetControls";
import { GameLayout } from "../components/GameLayout";
import { ResultBanner, type ResultKind } from "../components/ResultBanner";
import { SessionHistory } from "../components/SessionHistory";
import { useTokens } from "../context/TokenContext";
import { formatTokens, payoutFor } from "../lib/format";
import { secureInt } from "../lib/random";
import type { HistoryItem } from "../types";

export function Crash() {
  const { balance, credit, placeBet } = useTokens(); const [bet, setBet] = useState(10); const [value, setValue] = useState(1); const [active, setActive] = useState(false); const [kind, setKind] = useState<ResultKind>("neutral"); const [message, setMessage] = useState("Starte eine Runde und zahle aus, bevor der Flug endet."); const [history, setHistory] = useState<HistoryItem[]>([]); const targetRef = useRef(0); const stakeRef = useRef(0); const valueRef = useRef(1); const activeRef = useRef(false); const timerRef = useRef<number | null>(null);
  useEffect(() => () => { if (timerRef.current) window.clearInterval(timerRef.current); }, []);
  const finish = (cashed: boolean) => { if (!activeRef.current) return; if (timerRef.current) window.clearInterval(timerRef.current); const final = valueRef.current; const payout = cashed ? payoutFor(stakeRef.current, final) : 0; if (payout) credit(payout); activeRef.current = false; setActive(false); setKind(cashed ? "win" : "loss"); setMessage(cashed ? `Ausgezahlt bei ×${final.toFixed(2)}: ${formatTokens(payout)} TOKEN.` : `Crash bei ×${final.toFixed(2)} – die Runde endet.`); setHistory((items) => [{ id: Date.now(), title: cashed ? "Crash ausgezahlt" : "Crash", detail: `${cashed ? "Auszahlung" : "Absturz"} bei ×${final.toFixed(2)}`, change: payout - stakeRef.current, tone: cashed ? "win" as const : "loss" as const }, ...items].slice(0, 5)); };
  const start = () => { if (active || !placeBet(bet)) return; const crashAt = secureInt(115, 650) / 100; targetRef.current = crashAt; stakeRef.current = bet; valueRef.current = 1; activeRef.current = true; setValue(1); setActive(true); setKind("neutral"); setMessage("Der Flug steigt …"); timerRef.current = window.setInterval(() => { const next = Number((valueRef.current + .08 + valueRef.current * .018).toFixed(2)); valueRef.current = Math.min(next, targetRef.current); setValue(valueRef.current); if (next >= targetRef.current) finish(false); }, 150); };
  const chartEnd = Math.max(1.15, targetRef.current || value);
  const chartProgress = active ? Math.min(1, Math.max(0, (value - 1) / (chartEnd - 1))) : 0;
  const chartPoints = Array.from({ length: 25 }, (_, index) => {
    const t = index / 24;
    const x = chartProgress * 600 * t;
    const multiplier = 1 + (value - 1) * t;
    const y = 195 - Math.min(168, Math.log(multiplier) * 74);
    return `${x},${y}`;
  }).join(" ");
  return <GameLayout eyebrow="STEIGEN ODER AUSZAHLEN" title="Crash" description="Der Multiplikator steigt live. Du entscheidest, wann du deine virtuelle Runde beendest." rules={<ul><li>Der Einsatz wird beim Start reserviert.</li><li>Der Multiplikator steigt, bis der Flug crasht.</li><li>Zahle vorher aus, um Einsatz × aktuellem Wert zu erhalten.</li></ul>}><div className="simple-game-table"><div className={`crash-display ${active ? "active" : ""}`}><svg className="crash-chart" viewBox="0 0 600 220" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="crashStroke" x1="0" x2="1"><stop offset="0%" stopColor="#6eae7b"/><stop offset="100%" stopColor="#e3c16c"/></linearGradient></defs><polyline points={chartPoints} fill="none" stroke="url(#crashStroke)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/><circle cx={chartProgress * 600} cy={195 - Math.min(168, Math.log(value) * 74)} r="7" fill="#f5d888"/></svg><span>{active ? "IM FLUG" : "CRASH"}</span><strong>×{value.toFixed(2)}</strong></div><ResultBanner kind={kind}>{message}</ResultBanner><div className="game-action-area"><BetControls bet={bet} onBetChange={setBet} balance={balance} disabled={active}/>{active ? <button className="primary-action" type="button" onClick={() => finish(true)}>{formatTokens(payoutFor(stakeRef.current, value))} TOKEN · auszahlen</button> : <button className="primary-action" type="button" onClick={start} disabled={balance < bet}>{formatTokens(bet)} TOKEN · starten</button>}</div><SessionHistory items={history}/></div></GameLayout>;
}
