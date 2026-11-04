import { motion } from "framer-motion";

export interface CardData {
  rank: string;
  suit: "♥" | "♦" | "♣" | "♠";
  hidden?: boolean;
}

export function PlayingCard({ rank, suit, hidden = false, small = false }: CardData & { small?: boolean }) {
  if (hidden) return <motion.div initial={{ rotateY: 90 }} animate={{ rotateY: 0 }} className={`playing-card card-back ${small ? "small" : ""}`} aria-label="Verdeckte Karte"><span>✦</span></motion.div>;
  const red = suit === "♥" || suit === "♦";
  return (
    <motion.div initial={{ y: -14, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: "spring", stiffness: 260, damping: 22 }} className={`playing-card ${red ? "red" : ""} ${small ? "small" : ""}`} aria-label={`${rank} ${suit}`}>
      <span className="card-corner">{rank}<i>{suit}</i></span><strong>{suit}</strong><span className="card-corner flipped">{rank}<i>{suit}</i></span>
    </motion.div>
  );
}
