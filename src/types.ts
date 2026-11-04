export type GameId =
  | "roulette"
  | "blackjack"
  | "slots"
  | "dice"
  | "hilo"
  | "plinko"
  | "baccarat"
  | "wheel";

export type HistoryTone = "win" | "loss" | "neutral";

export interface HistoryItem {
  id: number;
  title: string;
  detail: string;
  change: number;
  tone: HistoryTone;
}

export interface GameMeta {
  id: GameId;
  name: string;
  kicker: string;
  description: string;
  accent: "violet" | "cyan" | "emerald" | "gold" | "rose";
  icon: string;
  route: string;
}
