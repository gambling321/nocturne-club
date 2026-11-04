import { motion, useReducedMotion } from "framer-motion";
import { ArrowDown, ArrowRight, CheckCircle2, Coins, Gamepad2, ShieldCheck, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { LobbyScene } from "../components/LobbyScene";
import { useTokens } from "../context/TokenContext";
import { formatTokens } from "../lib/format";
import type { GameMeta } from "../types";

const games: GameMeta[] = [
  { id: "roulette", name: "Europäisches Roulette", kicker: "DER KLASSIKER", description: "Eine Null, echte Einsatzfelder und eine präzise animierte Kugel.", accent: "gold", icon: "◉", route: "/roulette" },
  { id: "blackjack", name: "Blackjack", kicker: "21, OHNE HAST", description: "Zieh, bleib oder verdopple gegen den Dealer – mit klaren Regeln.", accent: "violet", icon: "A♠", route: "/blackjack" },
  { id: "slots", name: "Aurora Slots", kicker: "DREI WALZEN", description: "Originale Neon-Symbole, sichtbare Gewinnlinie und ruhige Reel-Animation.", accent: "cyan", icon: "✦", route: "/slots" },
  { id: "dice", name: "Dice Over / Under", kicker: "PRÄZISE CHANCE", description: "Wähle Ziel und Richtung. Chance und Multiplikator stehen immer offen da.", accent: "emerald", icon: "◆", route: "/dice" },
  { id: "hilo", name: "Hi-Lo Atelier", kicker: "KARTE LESEN", description: "Tipp höher oder tiefer und zahle deine laufende Runde aus, wann du willst.", accent: "rose", icon: "↑↓", route: "/hilo" },
  { id: "plinko", name: "Plinko Atrium", kicker: "KURVEN & GLÜCK", description: "Lass die Kugel durch das Pegboard fallen und wähle dein Risikoprofil.", accent: "gold", icon: "●", route: "/plinko" },
  { id: "baccarat", name: "Baccarat", kicker: "CARTES DE NUIT", description: "Spieler, Bank oder Gleichstand – mit verständlicher Kartenauswertung.", accent: "violet", icon: "K♦", route: "/baccarat" },
  { id: "wheel", name: "Lucky Wheel", kicker: "DAS FINALE", description: "Ein elegantes Rad, klare Segmente und nachvollziehbare Multiplikatoren.", accent: "cyan", icon: "✺", route: "/wheel" },
];

export function Lobby() {
  const { balance } = useTokens();
  const reducedMotion = useReducedMotion();
  const visibleGames = games;

  return (
    <main className="lobby-page">
      <section className="lobby-hero">
        <LobbyScene />
        <div className="hero-noise" aria-hidden="true" />
        <div className="hero-content content-width">
          <motion.div initial={reducedMotion ? false : { opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="hero-copy">
            <div className="private-label"><Sparkles size={14} /> PRIVATE GAME NIGHT</div>
            <h1>Der Abend<br /><em>hat Niveau.</em></h1>
            <p>NOCTURNE CLUB ist deine private Social-Casino-Lobby: acht kleine Spiele, ein gemeinsamer Tokenstand und absolut kein Echtgeld.</p>
            <div className="hero-actions">
              <a className="primary-button" href="#spiele">Lobby entdecken <ArrowDown size={17} /></a>
              <div className="hero-token"><Coins size={18} /><span><b>{formatTokens(balance)} TOKEN</b><small>nur diese Sitzung</small></span></div>
            </div>
          </motion.div>
          <motion.div className="hero-side-note" initial={reducedMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55, duration: 0.7 }}>
            <span className="status-light" /> SESSION AKTIV<br />Tokens werden beim Reload auf 1.000 gesetzt.
          </motion.div>
        </div>
        <a href="#spiele" className="scroll-cue" aria-label="Zu den Spielen scrollen"><span /> Scrollen</a>
      </section>

      <section className="lobby-intro content-width" id="spiele">
        <div><span className="eyebrow">DIE SPIELRÄUME</span><h2>Wähle deine<br /><em>Station.</em></h2></div>
        <p>Beim Scrollen öffnet sich die Lobby Raum für Raum. Jeder Tisch hat eigene Regeln, transparente Auszahlungen und eine kleine Historie für diese Sitzung.</p>
      </section>

      <section className="game-stations content-width" aria-label="Spiele auswählen">
        {visibleGames.map((game, index) => (
          <motion.article key={game.id} className={`station-card accent-${game.accent}`} initial={reducedMotion ? false : { opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.52, delay: (index % 2) * 0.06 }}>
            <Link className="station-visual" to={game.route} aria-label={`${game.name} spielen`}><span className="station-orbit orbit-a" /><span className="station-orbit orbit-b" /><span className="station-icon">{game.icon}</span><span className="station-shine" /></Link>
            <div className="station-copy"><span className="eyebrow">{game.kicker}</span><h3>{game.name}</h3><p>{game.description}</p><Link className="text-link" to={game.route}>Spielen <ArrowRight size={16} /></Link></div>
            <span className="station-index">0{index + 1}</span>
          </motion.article>
        ))}
      </section>

      <section className="promise-section content-width">
        <div className="promise-copy"><span className="eyebrow">GUT ZU WISSEN</span><h2>Gut spielen<br /><em>heißt entspannt spielen.</em></h2></div>
        <div className="promise-list">
          <div><ShieldCheck size={21} /><p><strong>Rein virtuell</strong><br />Keine Käufe, Konten, Auszahlungen oder Echtgeldwerte.</p></div>
          <div><Coins size={21} /><p><strong>Einfach & lokal</strong><br />1.000 Tokens beim Reload, ohne Speicher, ohne Tracking.</p></div>
          <div><Gamepad2 size={21} /><p><strong>Dein Tempo</strong><br />Kein Zeitdruck, keine Verknappung, keine Push-Nachrichten.</p></div>
        </div>
      </section>
      <section className="lobby-closing content-width"><span>NOCTURNE CLUB / PRIVATE DEMO</span><h2>Ein Tisch. Ein Abend.<br /><em>Nur zum Spaß.</em></h2><p>Alle Ergebnisse entstehen lokal im Browser. Die Token haben keinen Wert außerhalb dieser Demo und werden nicht gespeichert.</p></section>
    </main>
  );
}
