import { useEffect, useMemo, useRef, useState } from "react";
import { BetControls } from "../components/BetControls";
import { GameLayout } from "../components/GameLayout";
import { PlayingCard, type CardData } from "../components/PlayingCard";
import { ResultBanner, type ResultKind } from "../components/ResultBanner";
import { SessionHistory } from "../components/SessionHistory";
import { useTokens } from "../context/TokenContext";
import { formatTokens, sleep } from "../lib/format";
import { secureInt, shuffled } from "../lib/random";
import type { HistoryItem } from "../types";

type RoundPhase = "idle" | "player" | "dealer" | "resolved";
type Settlement = "win" | "loss" | "push" | "blackjack";

const suits: CardData["suit"][] = ["♥", "♦", "♣", "♠"];
const ranks = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

function newDeck(): CardData[] {
  return shuffled(suits.flatMap((suit) => ranks.map((rank) => ({ rank, suit }))));
}

function handScore(cards: CardData[]) {
  let aces = 0;
  let total = 0;
  for (const card of cards) {
    if (card.rank === "A") {
      aces += 1;
      total += 11;
    } else if (["K", "Q", "J"].includes(card.rank)) {
      total += 10;
    } else {
      total += Number(card.rank);
    }
  }
  while (total > 21 && aces > 0) {
    total -= 10;
    aces -= 1;
  }
  return { total, soft: aces > 0 };
}

function visibleDealerScore(cards: CardData[], hidden: boolean): string {
  if (!cards.length) return "–";
  return hidden ? `${handScore(cards.slice(0, 1)).total} + ?` : String(handScore(cards).total);
}

export function Blackjack() {
  const { balance, credit, placeBet } = useTokens();
  const [bet, setBet] = useState(10);
  const [playerCards, setPlayerCards] = useState<CardData[]>([]);
  const [dealerCards, setDealerCards] = useState<CardData[]>([]);
  const [phase, setPhase] = useState<RoundPhase>("idle");
  const [activeStake, setActiveStake] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [message, setMessage] = useState("Gib Karten aus, wenn du bereit bist.");
  const [resultKind, setResultKind] = useState<ResultKind>("neutral");
  const deckRef = useRef<CardData[]>([]);

  const playerScore = useMemo(() => handScore(playerCards), [playerCards]);
  const dealerHidden = phase === "player";

  useEffect(() => {
    if (balance > 0) setBet((current) => Math.max(1, Math.min(current, balance)));
  }, [balance]);

  const drawCard = (): CardData => {
    if (deckRef.current.length === 0) deckRef.current = newDeck();
    return deckRef.current.pop()!;
  };

  const addHistory = (item: Omit<HistoryItem, "id">) => {
    setHistory((current) => [
      { ...item, id: Date.now() + secureInt(1, 999) },
      ...current,
    ].slice(0, 5));
  };

  const settle = (outcome: Settlement, stake: number, detail: string) => {
    const payout = outcome === "win"
      ? stake * 2
      : outcome === "blackjack"
        ? Math.floor(stake * 2.5)
        : outcome === "push"
          ? stake
          : 0;
    const change = payout - stake;
    const kind: ResultKind = outcome === "loss" ? "loss" : outcome === "push" ? "neutral" : "win";
    const headline = outcome === "blackjack"
      ? "Blackjack!"
      : outcome === "win"
        ? "Gewonnen!"
        : outcome === "push"
          ? "Unentschieden."
          : "Diese Hand geht an den Dealer.";

    if (payout > 0) credit(payout);
    setResultKind(kind);
    setMessage(`${headline} ${detail}${payout > 0 ? ` Auszahlung: ${formatTokens(payout)} TOKEN.` : ""}`);
    addHistory({
      title: outcome === "push" ? "Blackjack unentschieden" : outcome === "loss" ? "Blackjack verloren" : outcome === "blackjack" ? "Blackjack" : "Blackjack gewonnen",
      detail,
      change,
      tone: kind,
    });
    setPhase("resolved");
    setIsAnimating(false);
  };

  const playDealer = async (finalPlayerCards: CardData[], initialDealerCards: CardData[], stake: number) => {
    let finalDealerCards = [...initialDealerCards];
    setPhase("dealer");
    setDealerCards(finalDealerCards);
    setIsAnimating(true);
    setMessage("Der Dealer deckt auf …");
    await sleep(450);

    while (handScore(finalDealerCards).total < 17) {
      finalDealerCards = [...finalDealerCards, drawCard()];
      setDealerCards(finalDealerCards);
      setMessage("Der Dealer zieht eine Karte …");
      await sleep(500);
    }

    const playerTotal = handScore(finalPlayerCards).total;
    const dealerTotal = handScore(finalDealerCards).total;
    if (dealerTotal > 21) {
      settle("win", stake, `Dealer ${dealerTotal}, du ${playerTotal}. Dealer überkauft.`);
    } else if (playerTotal > dealerTotal) {
      settle("win", stake, `Du ${playerTotal}, Dealer ${dealerTotal}.`);
    } else if (playerTotal === dealerTotal) {
      settle("push", stake, `Du und der Dealer haben ${playerTotal}.`);
    } else {
      settle("loss", stake, `Du ${playerTotal}, Dealer ${dealerTotal}.`);
    }
  };

  const deal = async () => {
    if (isAnimating || phase === "player" || phase === "dealer" || balance < 1 || bet > balance) return;
    const stake = bet;
    if (!placeBet(stake)) {
      setResultKind("loss");
      setMessage("Der Einsatz ist nicht mehr verfügbar.");
      return;
    }

    deckRef.current = newDeck();
    const nextPlayer = [drawCard(), drawCard()];
    const nextDealer = [drawCard(), drawCard()];
    setPlayerCards(nextPlayer);
    setDealerCards(nextDealer);
    setActiveStake(stake);
    setPhase("player");
    setResultKind("neutral");
    setMessage("Die Karten werden ausgegeben …");
    setIsAnimating(true);
    await sleep(650);

    const playerNatural = handScore(nextPlayer).total === 21;
    const dealerNatural = handScore(nextDealer).total === 21;
    if (playerNatural || dealerNatural) {
      setPhase("dealer");
      setDealerCards(nextDealer);
      await sleep(400);
      if (playerNatural && dealerNatural) {
        settle("push", stake, "Beide Hände zeigen Blackjack.");
      } else if (playerNatural) {
        settle("blackjack", stake, "21 mit zwei Karten · Auszahlung 3:2 (auf ganze Tokens abgerundet).");
      } else {
        settle("loss", stake, "Der Dealer hat Blackjack.");
      }
      return;
    }
    setMessage("Deine Entscheidung: Ziehen, stehen oder verdoppeln.");
    setIsAnimating(false);
  };

  const hit = async () => {
    if (phase !== "player" || isAnimating) return;
    const nextPlayer = [...playerCards, drawCard()];
    setPlayerCards(nextPlayer);
    setIsAnimating(true);
    setMessage("Eine Karte für dich …");
    await sleep(420);
    const total = handScore(nextPlayer).total;
    if (total > 21) {
      settle("loss", activeStake, `Du hast ${total} und bist über 21.`);
    } else if (total === 21) {
      await playDealer(nextPlayer, dealerCards, activeStake);
    } else {
      setMessage(`Du hast ${total}. Ziehen oder stehen?`);
      setIsAnimating(false);
    }
  };

  const stand = async () => {
    if (phase !== "player" || isAnimating) return;
    await playDealer(playerCards, dealerCards, activeStake);
  };

  const doubleDown = async () => {
    if (phase !== "player" || isAnimating || playerCards.length !== 2 || balance < activeStake) return;
    if (!placeBet(activeStake)) return;
    const doubledStake = activeStake * 2;
    const nextPlayer = [...playerCards, drawCard()];
    setActiveStake(doubledStake);
    setPlayerCards(nextPlayer);
    setIsAnimating(true);
    setMessage("Einsatz verdoppelt. Eine letzte Karte …");
    await sleep(500);
    if (handScore(nextPlayer).total > 21) {
      settle("loss", doubledStake, `Du hast ${handScore(nextPlayer).total} und bist über 21.`);
      return;
    }
    await playDealer(nextPlayer, dealerCards, doubledStake);
  };

  return (
    <GameLayout
      eyebrow="KLASSISCHER TISCH"
      title="Blackjack"
      description="Ein klarer Tisch gegen den Dealer – ohne Echtgeld, nur mit virtuellen Tokens."
      rules={(
        <ul>
          <li>Du gewinnst mit einer höheren Hand bis 21; der Dealer zieht bis mindestens 17.</li>
          <li>Normale Gewinne zahlen 2× aus, Blackjack mit zwei Karten 3:2.</li>
          <li>Bei Gleichstand erhältst du deinen Einsatz zurück. Verdoppeln zieht genau eine Karte.</li>
        </ul>
      )}
    >
      <div className="blackjack-table">
        <div className="blackjack-hands">
          <section className="card-hand dealer-hand" aria-label="Hand des Dealers">
            <div className="hand-label"><span>DEALER</span><strong>{visibleDealerScore(dealerCards, dealerHidden)}</strong></div>
            <div className="playing-card-row">
              {dealerCards.length === 0 ? <span className="card-placeholder">Wartet auf Karten</span> : dealerCards.map((card, index) => (
                <PlayingCard key={`${card.rank}${card.suit}-${index}`} {...card} hidden={dealerHidden && index === 1} />
              ))}
            </div>
          </section>
          <div className="blackjack-divider" aria-hidden="true"><span>VS</span></div>
          <section className="card-hand player-hand" aria-label="Deine Hand">
            <div className="hand-label"><span>DU</span><strong>{playerCards.length ? playerScore.total : "–"}</strong></div>
            <div className="playing-card-row">
              {playerCards.length === 0 ? <span className="card-placeholder">Deine Karten erscheinen hier</span> : playerCards.map((card, index) => (
                <PlayingCard key={`${card.rank}${card.suit}-${index}`} {...card} />
              ))}
            </div>
          </section>
        </div>

        <ResultBanner kind={resultKind}>{message}</ResultBanner>

        {phase === "player" ? (
          <div className="blackjack-actions" aria-label="Blackjack-Aktionen">
            <button className="secondary-action" type="button" onClick={hit} disabled={isAnimating}>Karte ziehen</button>
            <button className="primary-action" type="button" onClick={stand} disabled={isAnimating}>Stehen</button>
            <button className="secondary-action" type="button" onClick={doubleDown} disabled={isAnimating || playerCards.length !== 2 || balance < activeStake}>
              Verdoppeln ({formatTokens(activeStake)} TOKEN)
            </button>
          </div>
        ) : (
          <div className="game-action-area blackjack-deal-area">
            <BetControls bet={bet} onBetChange={setBet} balance={balance} disabled={isAnimating} />
            <button className="primary-action" type="button" onClick={deal} disabled={isAnimating || balance < 1 || bet > balance}>
              {isAnimating ? "Karten werden ausgegeben …" : `${formatTokens(bet)} TOKEN · Karten geben`}
            </button>
          </div>
        )}

        <SessionHistory items={history} />
      </div>
    </GameLayout>
  );
}

export default Blackjack;
