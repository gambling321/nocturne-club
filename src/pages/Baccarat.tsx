import { useRef, useState } from "react";
import { BetControls } from "../components/BetControls";
import { GameLayout } from "../components/GameLayout";
import { PlayingCard, type CardData } from "../components/PlayingCard";
import { ResultBanner, type ResultKind } from "../components/ResultBanner";
import { SessionHistory } from "../components/SessionHistory";
import { useTokens } from "../context/TokenContext";
import { formatTokens, payoutFor, sleep } from "../lib/format";
import { securePick } from "../lib/random";
import type { HistoryItem } from "../types";

type BaccaratBet = "player" | "banker" | "tie";
type BaccaratCard = CardData & { value: number };

const RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "B", "D", "K"] as const;
const SUITS = ["♥", "♦", "♣", "♠"] as const;
const BET_LABELS: Record<BaccaratBet, string> = { player: "Spieler", banker: "Bank", tie: "Unentschieden" };
const PAYOUTS: Record<BaccaratBet, string> = { player: "×2,00", banker: "×1,95", tie: "×9,00" };

function cardValue(rank: (typeof RANKS)[number]): number {
  if (rank === "A") return 1;
  if (rank === "B" || rank === "D" || rank === "K" || rank === "10") return 0;
  return Number(rank);
}

function drawCard(): BaccaratCard {
  const rank = securePick(RANKS);
  return { rank, suit: securePick(SUITS), value: cardValue(rank) };
}

function handTotal(cards: BaccaratCard[]): number {
  return cards.reduce((total, card) => total + card.value, 0) % 10;
}

function dealRound(): { player: BaccaratCard[]; banker: BaccaratCard[]; winner: BaccaratBet; playerTotal: number; bankerTotal: number } {
  const player = [drawCard(), drawCard()];
  const banker = [drawCard(), drawCard()];
  let playerTotal = handTotal(player);
  let bankerTotal = handTotal(banker);

  if (playerTotal < 8 && bankerTotal < 8) {
    let playerThird: BaccaratCard | undefined;
    if (playerTotal <= 5) {
      playerThird = drawCard();
      player.push(playerThird);
      playerTotal = handTotal(player);
    }

    let bankerDraws = false;
    if (!playerThird) {
      bankerDraws = bankerTotal <= 5;
    } else if (bankerTotal <= 2) {
      bankerDraws = true;
    } else if (bankerTotal === 3) {
      bankerDraws = playerThird.value !== 8;
    } else if (bankerTotal === 4) {
      bankerDraws = playerThird.value >= 2 && playerThird.value <= 7;
    } else if (bankerTotal === 5) {
      bankerDraws = playerThird.value >= 4 && playerThird.value <= 7;
    } else if (bankerTotal === 6) {
      bankerDraws = playerThird.value === 6 || playerThird.value === 7;
    }

    if (bankerDraws) banker.push(drawCard());
    bankerTotal = handTotal(banker);
  }

  const winner: BaccaratBet = playerTotal === bankerTotal ? "tie" : playerTotal > bankerTotal ? "player" : "banker";
  return { player, banker, winner, playerTotal, bankerTotal };
}

function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function Baccarat() {
  const { balance, placeBet, credit } = useTokens();
  const [bet, setBet] = useState(10);
  const [selection, setSelection] = useState<BaccaratBet>("player");
  const [playerCards, setPlayerCards] = useState<BaccaratCard[]>([]);
  const [bankerCards, setBankerCards] = useState<BaccaratCard[]>([]);
  const [isDealing, setIsDealing] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [feedback, setFeedback] = useState<{ kind: ResultKind; message: string }>({
    kind: "neutral",
    message: "Wähle Spieler, Bank oder Unentschieden und eröffne die nächste Coup-Runde.",
  });
  const historyId = useRef(0);

  const pushHistory = (item: Omit<HistoryItem, "id">) => {
    historyId.current += 1;
    setHistory((items) => [{ id: historyId.current, ...item }, ...items].slice(0, 5));
  };

  const updateBet = (value: number) => {
    setBet(Math.max(1, Math.min(Math.max(1, balance), Math.floor(value) || 1)));
  };

  const deal = async () => {
    if (isDealing) return;
    if (bet > balance || !placeBet(bet)) {
      setFeedback({ kind: "loss", message: "Für diesen Einsatz sind nicht genug Tokens verfügbar." });
      return;
    }

    const round = dealRound();
    const delay = prefersReducedMotion() ? 35 : 300;
    setPlayerCards([]);
    setBankerCards([]);
    setIsDealing(true);
    setFeedback({ kind: "neutral", message: "Die Karten werden ausgeteilt …" });

    setPlayerCards([round.player[0]!]);
    await sleep(delay);
    setBankerCards([round.banker[0]!]);
    await sleep(delay);
    setPlayerCards(round.player.slice(0, 2));
    await sleep(delay);
    setBankerCards(round.banker.slice(0, 2));
    await sleep(delay);
    setPlayerCards(round.player);
    setBankerCards(round.banker);
    await sleep(delay);

    const won = round.winner === selection;
    const multiplier = selection === "player" ? 2 : selection === "banker" ? 1.95 : 9;
    const payout = won ? payoutFor(bet, multiplier) : 0;
    if (payout > 0) credit(payout);
    const change = payout - bet;
    const kind: ResultKind = won ? "win" : "loss";
    pushHistory({
      title: `Baccarat · ${won ? "Treffer" : "Verloren"}`,
      detail: `${BET_LABELS[round.winner]} gewinnt ${round.playerTotal} : ${round.bankerTotal}.`,
      change,
      tone: kind,
    });
    setFeedback({
      kind,
      message: won
        ? `${BET_LABELS[round.winner]} gewinnt ${round.playerTotal} : ${round.bankerTotal}. ${formatTokens(payout)} TOKEN wurden gutgeschrieben.`
        : `${BET_LABELS[round.winner]} gewinnt ${round.playerTotal} : ${round.bankerTotal}. Dein Tipp auf ${BET_LABELS[selection]} trifft nicht.`,
    });
    setIsDealing(false);
  };

  return (
    <GameLayout
      eyebrow="SALON-TISCH · 07"
      title="Baccarat"
      description="Setze auf Spieler, Bank oder Gleichstand und erlebe einen klassischen Coup mit transparenten Auszahlungen."
      rules={(
        <ul>
          <li>Setze vor dem Austeilen auf Spieler, Bank oder Unentschieden.</li>
          <li>Die höchste Punktzahl nahe 9 gewinnt; Zehner und Bilder zählen 0.</li>
          <li>Spieler zahlt ×2,00, Bank ×1,95 und Unentschieden ×9,00 aus.</li>
          <li>Dritte Karten werden nach den üblichen Baccarat-Regeln gezogen.</li>
        </ul>
      )}
    >
      <div className="baccarat-table game-table-inner">
        <div className="baccarat-hands" aria-label="Baccarat Karten">
          <section className="baccarat-hand player-hand">
            <div className="hand-heading"><span>SPIELER</span><strong>{playerCards.length ? handTotal(playerCards) : "–"}</strong></div>
            <div className="card-row">
              {playerCards.length ? playerCards.map((card, index) => <PlayingCard key={`p-${index}-${card.rank}-${card.suit}`} {...card} />) : <div className="card-placeholder">Bereit</div>}
            </div>
          </section>
          <span className="versus-mark" aria-hidden="true">VS</span>
          <section className="baccarat-hand banker-hand">
            <div className="hand-heading"><span>BANK</span><strong>{bankerCards.length ? handTotal(bankerCards) : "–"}</strong></div>
            <div className="card-row">
              {bankerCards.length ? bankerCards.map((card, index) => <PlayingCard key={`b-${index}-${card.rank}-${card.suit}`} {...card} />) : <div className="card-placeholder">Bereit</div>}
            </div>
          </section>
        </div>

        <div className="baccarat-bets" role="radiogroup" aria-label="Baccarat Tipp">
          {(Object.keys(BET_LABELS) as BaccaratBet[]).map((option) => (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={selection === option}
              className={`baccarat-bet ${option} ${selection === option ? "selected" : ""}`}
              disabled={isDealing}
              onClick={() => setSelection(option)}
            >
              <strong>{BET_LABELS[option]}</strong><span>{PAYOUTS[option]}</span>
            </button>
          ))}
        </div>

        <ResultBanner kind={feedback.kind}>{feedback.message}</ResultBanner>

        <div className="game-controls">
          <BetControls bet={bet} onBetChange={updateBet} balance={balance} disabled={isDealing} label={`Einsatz auf ${BET_LABELS[selection]}`} />
          <button type="button" className="game-action primary full-width" disabled={isDealing || balance < 1} onClick={() => void deal()}>
            {isDealing ? "Karten werden ausgeteilt …" : `${formatTokens(bet)} TOKEN setzen`}
          </button>
        </div>

        <SessionHistory items={history} />
      </div>
    </GameLayout>
  );
}
