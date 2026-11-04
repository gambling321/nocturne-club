import { useRef, useState } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import { BetControls } from "../components/BetControls";
import { GameLayout } from "../components/GameLayout";
import { PlayingCard, type CardData } from "../components/PlayingCard";
import { ResultBanner, type ResultKind } from "../components/ResultBanner";
import { SessionHistory } from "../components/SessionHistory";
import { useTokens } from "../context/TokenContext";
import { formatTokens, payoutFor, sleep } from "../lib/format";
import { securePick } from "../lib/random";
import type { HistoryItem } from "../types";

type HiLoCard = CardData & { value: number };
type Direction = "higher" | "lower";

const RANKS = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "B", "D", "K", "A"] as const;
const SUITS = ["♥", "♦", "♣", "♠"] as const;

function drawCard(): HiLoCard {
  const rank = securePick(RANKS);
  return {
    rank,
    suit: securePick(SUITS),
    value: RANKS.indexOf(rank) + 2,
  };
}

function chanceFor(card: HiLoCard, direction: Direction): number {
  const winningRanks = direction === "higher" ? 14 - card.value : card.value - 2;
  return winningRanks / 13;
}

function multiplierFor(chance: number): number {
  return Number((0.96 / chance).toFixed(2));
}

function cardLabel(card: HiLoCard): string {
  return `${card.rank}${card.suit}`;
}

export function HiLo() {
  const { balance, placeBet, credit } = useTokens();
  const [bet, setBet] = useState(10);
  const [currentCard, setCurrentCard] = useState<HiLoCard>(() => drawCard());
  const [revealedCard, setRevealedCard] = useState<HiLoCard | null>(null);
  const [roundStake, setRoundStake] = useState(0);
  const [roundMultiplier, setRoundMultiplier] = useState(1);
  const [roundActive, setRoundActive] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [feedback, setFeedback] = useState<{ kind: ResultKind; message: string }>({
    kind: "neutral",
    message: "Lege deinen Einsatz fest und beginne eine Hi-Lo-Runde.",
  });
  const historyId = useRef(0);

  const pushHistory = (item: Omit<HistoryItem, "id">) => {
    historyId.current += 1;
    setHistory((items) => [{ id: historyId.current, ...item }, ...items].slice(0, 5));
  };

  const updateBet = (value: number) => {
    setBet(Math.max(1, Math.min(Math.max(1, balance), Math.floor(value) || 1)));
  };

  const beginRound = () => {
    if (roundActive || isResolving) return;
    if (bet > balance || !placeBet(bet)) {
      setFeedback({ kind: "loss", message: "Für diesen Einsatz sind nicht genug Tokens verfügbar." });
      return;
    }

    setCurrentCard(drawCard());
    setRevealedCard(null);
    setRoundStake(bet);
    setRoundMultiplier(1);
    setRoundActive(true);
    setFeedback({ kind: "neutral", message: "Deine Startkarte liegt. Wird die nächste Karte höher oder tiefer?" });
  };

  const makeGuess = async (direction: Direction) => {
    if (!roundActive || isResolving || roundStake < 1) return;
    const chance = chanceFor(currentCard, direction);
    if (chance <= 0) return;

    const nextCard = drawCard();
    const won = direction === "higher" ? nextCard.value > currentCard.value : nextCard.value < currentCard.value;
    setIsResolving(true);
    setRevealedCard(nextCard);
    setFeedback({ kind: "neutral", message: "Die nächste Karte wird aufgedeckt …" });
    await sleep(650);

    if (won) {
      const nextMultiplier = Number((roundMultiplier * multiplierFor(chance)).toFixed(2));
      setCurrentCard(nextCard);
      setRevealedCard(null);
      setRoundMultiplier(nextMultiplier);
      setFeedback({
        kind: "win",
        message: `${cardLabel(nextCard)} war ${direction === "higher" ? "höher" : "tiefer"}. Dein Rundenwert liegt jetzt bei ${formatTokens(payoutFor(roundStake, nextMultiplier))} TOKEN.`,
      });
    } else {
      setCurrentCard(nextCard);
      setRoundActive(false);
      setRoundMultiplier(1);
      pushHistory({
        title: "Hi-Lo verloren",
        detail: `${cardLabel(nextCard)} war nicht ${direction === "higher" ? "höher" : "tiefer"} als ${cardLabel(currentCard)}.`,
        change: -roundStake,
        tone: "loss",
      });
      setFeedback({ kind: "loss", message: `Leider verloren – dein Einsatz von ${formatTokens(roundStake)} TOKEN ist beendet.` });
    }

    setIsResolving(false);
  };

  const cashOut = () => {
    if (!roundActive || isResolving || roundStake < 1) return;
    const payout = payoutFor(roundStake, roundMultiplier);
    credit(payout);
    const change = payout - roundStake;
    pushHistory({
      title: "Hi-Lo ausgezahlt",
      detail: `Auszahlung bei ×${roundMultiplier.toFixed(2)}.`,
      change,
      tone: change > 0 ? "win" : "neutral",
    });
    setRoundActive(false);
    setRoundStake(0);
    setRoundMultiplier(1);
    setFeedback({ kind: change > 0 ? "win" : "neutral", message: `${formatTokens(payout)} TOKEN wurden deinem Kontostand gutgeschrieben.` });
  };

  const higherChance = chanceFor(currentCard, "higher");
  const lowerChance = chanceFor(currentCard, "lower");
  const locked = isResolving || roundActive;

  return (
    <GameLayout
      eyebrow="KARTENTISCH · 05"
      title="Hi-Lo"
      description="Lies die nächste Karte richtig, baue deinen Multiplikator auf und zahle zum richtigen Moment aus."
      rules={(
        <ul>
          <li>Dein Einsatz wird zu Beginn der Runde reserviert.</li>
          <li>Rate, ob die nächste Karte höher oder tiefer als die sichtbare Karte ist.</li>
          <li>Gleiche Werte zählen nicht als Treffer.</li>
          <li>Nach jedem Treffer kannst du weiterspielen oder auszahlen.</li>
        </ul>
      )}
    >
      <div className="hilo-table game-table-inner">
        <div className="round-meta">
          <span>Rundenwert</span>
          <strong>{roundActive ? `${formatTokens(payoutFor(roundStake, roundMultiplier))} TOKEN` : "—"}</strong>
          <small>{roundActive ? `×${roundMultiplier.toFixed(2)}` : "Noch keine aktive Runde"}</small>
        </div>

        <div className="hilo-cards" aria-label="Hi-Lo Karten">
          <div className="card-seat">
            <span>Aktuelle Karte</span>
            <PlayingCard {...currentCard} />
          </div>
          <div className="hilo-arrow" aria-hidden="true">→</div>
          <div className="card-seat">
            <span>Nächste Karte</span>
            {revealedCard ? <PlayingCard {...revealedCard} /> : <PlayingCard rank="?" suit="♠" hidden />}
          </div>
        </div>

        <ResultBanner kind={feedback.kind}>{feedback.message}</ResultBanner>

        {roundActive ? (
          <div className="round-actions hilo-actions">
            <button
              type="button"
              className="game-action secondary"
              disabled={isResolving || lowerChance <= 0}
              onClick={() => void makeGuess("lower")}
            >
              <ArrowDown size={18} /> Tiefer <small>{lowerChance > 0 ? `${Math.round(lowerChance * 100)} %` : "nicht möglich"}</small>
            </button>
            <button
              type="button"
              className="game-action primary"
              disabled={isResolving || higherChance <= 0}
              onClick={() => void makeGuess("higher")}
            >
              <ArrowUp size={18} /> Höher <small>{higherChance > 0 ? `${Math.round(higherChance * 100)} %` : "nicht möglich"}</small>
            </button>
            <button type="button" className="game-action cashout" disabled={isResolving} onClick={cashOut}>
              {isResolving ? "Aufdecken …" : `${formatTokens(payoutFor(roundStake, roundMultiplier))} TOKEN auszahlen`}
            </button>
          </div>
        ) : (
          <div className="game-controls">
            <BetControls bet={bet} onBetChange={updateBet} balance={balance} disabled={locked} />
            <button type="button" className="game-action primary full-width" disabled={balance < 1 || isResolving} onClick={beginRound}>
              Runde für {formatTokens(bet)} TOKEN beginnen
            </button>
          </div>
        )}

        <SessionHistory items={history} />
      </div>
    </GameLayout>
  );
}
