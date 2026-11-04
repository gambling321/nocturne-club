import { ArrowLeft, CircleHelp } from "lucide-react";
import { Link } from "react-router-dom";
import type { ReactNode } from "react";

interface GameLayoutProps {
  eyebrow: string;
  title: string;
  description: string;
  rules: ReactNode;
  children: ReactNode;
}

export function GameLayout({ eyebrow, title, description, rules, children }: GameLayoutProps) {
  return (
    <main className="game-page">
      <div className="game-heading content-width">
        <Link className="back-link" to="/"><ArrowLeft size={16} /> Zurück zur Lobby</Link>
        <div>
          <span className="eyebrow">{eyebrow}</span>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
      </div>
      <div className="game-grid content-width">
        <section className="game-table" aria-label={`${title} Spieltisch`}>
          {children}
        </section>
        <aside className="game-aside">
          <section className="rule-card">
            <h2><CircleHelp size={18} /> So spielt man</h2>
            <div className="rule-card-content">{rules}</div>
          </section>
          <section className="demo-card">
            <span className="demo-dot" aria-hidden="true" />
            <div><strong>Private Demo</strong><br />Nur virtuelle Tokens – kein Echtgeldwert.</div>
          </section>
        </aside>
      </div>
    </main>
  );
}
