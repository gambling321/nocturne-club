import { Link, useLocation } from "react-router-dom";
import { ChevronDown, Menu, X, Volume2, VolumeX } from "lucide-react";
import { useEffect, useState } from "react";
import { useTokens } from "../context/TokenContext";
import { formatTokens } from "../lib/format";

export function Header() {
  const { balance } = useTokens();
  const { pathname } = useLocation();
  const [soundOn, setSoundOn] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [gamesOpen, setGamesOpen] = useState(false);
  const gameLinks = [
    ["Blackjack", "/blackjack"], ["Roulette", "/roulette"], ["Slots", "/slots"], ["Dice", "/dice"], ["Hi-Lo", "/hilo"], ["Plinko", "/plinko"], ["Baccarat", "/baccarat"], ["Lucky Wheel", "/wheel"], ["Mines", "/mines"], ["Crash", "/crash"], ["Limbo", "/limbo"], ["Keno", "/keno"], ["Video Poker", "/video-poker"], ["Dragon Tiger", "/dragon-tiger"], ["Coin Flip", "/coinflip"],
  ];
  const inLobby = pathname === "/";
  useEffect(() => setMenuOpen(false), [pathname]);

  return (
    <header className="site-header">
      <Link className="brand" to="/" aria-label="NOCTURNE CLUB Lobby">
        <span className="brand-mark" aria-hidden="true">N</span>
        <span>NOCTURNE <b>CLUB</b></span>
      </Link>
      <div className="header-actions">
        <div className="token-pill" aria-label={`${formatTokens(balance)} Token verfügbar`}>
          <span className="token-orb" aria-hidden="true" />
          <strong>{formatTokens(balance)}</strong> TOKEN
        </div>
        <button
          className="icon-button sound-toggle"
          type="button"
          aria-pressed={soundOn}
          aria-label={soundOn ? "Sound ausschalten" : "Sound einschalten"}
          onClick={() => setSoundOn((current) => !current)}
        >
          {soundOn ? <Volume2 size={18} /> : <VolumeX size={18} />}
        </button>
        {!inLobby && <Link className="lobby-link" to="/">Zur Lobby</Link>}
        <div className="games-dropdown">
          <button className="games-dropdown-trigger" type="button" aria-expanded={gamesOpen} aria-controls="games-menu" onClick={() => setGamesOpen((open) => !open)}>Spiele <ChevronDown size={14}/></button>
          {gamesOpen && <nav className="games-dropdown-menu" id="games-menu" aria-label="Alle Spiele">{gameLinks.map(([name, route]) => <Link key={route} to={route} onClick={() => setGamesOpen(false)}>{name}</Link>)}</nav>}
        </div>
        <button
          className="icon-button menu-toggle"
          type="button"
          aria-expanded={menuOpen}
          aria-label={menuOpen ? "Menü schließen" : "Spielmenü öffnen"}
          onClick={() => setMenuOpen((current) => !current)}
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>
      {menuOpen && (
        <nav className="mobile-menu" aria-label="Spielnavigation">
          {gameLinks.map(([name, route]) => <Link key={route} to={route} onClick={() => setMenuOpen(false)}>{name}</Link>)}
        </nav>
      )}
    </header>
  );
}
