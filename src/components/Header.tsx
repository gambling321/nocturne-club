import { Link, useLocation } from "react-router-dom";
import { Menu, X, Volume2, VolumeX } from "lucide-react";
import { useEffect, useState } from "react";
import { useTokens } from "../context/TokenContext";
import { formatTokens } from "../lib/format";

export function Header() {
  const { balance } = useTokens();
  const { pathname } = useLocation();
  const [soundOn, setSoundOn] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
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
          <Link to="/roulette" onClick={() => setMenuOpen(false)}>Roulette</Link>
          <Link to="/blackjack" onClick={() => setMenuOpen(false)}>Blackjack</Link>
          <Link to="/slots" onClick={() => setMenuOpen(false)}>Slots</Link>
          <Link to="/dice" onClick={() => setMenuOpen(false)}>Dice</Link>
          <Link to="/hilo" onClick={() => setMenuOpen(false)}>Hi-Lo</Link>
          <Link to="/plinko" onClick={() => setMenuOpen(false)}>Plinko</Link>
          <Link to="/baccarat" onClick={() => setMenuOpen(false)}>Baccarat</Link>
          <Link to="/wheel" onClick={() => setMenuOpen(false)}>Lucky Wheel</Link>
          <Link to="/mines" onClick={() => setMenuOpen(false)}>Mines</Link>
          <Link to="/crash" onClick={() => setMenuOpen(false)}>Crash</Link>
          <Link to="/limbo" onClick={() => setMenuOpen(false)}>Limbo</Link>
          <Link to="/keno" onClick={() => setMenuOpen(false)}>Keno</Link>
          <Link to="/video-poker" onClick={() => setMenuOpen(false)}>Video Poker</Link>
          <Link to="/dragon-tiger" onClick={() => setMenuOpen(false)}>Dragon Tiger</Link>
          <Link to="/coinflip" onClick={() => setMenuOpen(false)}>Coin Flip</Link>
        </nav>
      )}
    </header>
  );
}
