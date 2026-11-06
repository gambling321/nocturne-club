import { motion, useReducedMotion } from "framer-motion";
import { ArrowDown, ArrowRight, Coins, Gamepad2, ShieldCheck, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { LobbyScene } from "../components/LobbyScene";
import { LobbyJourney } from "../components/LobbyJourney";
import { useTokens } from "../context/TokenContext";
import { formatTokens } from "../lib/format";
import type { GameMeta } from "../types";

const games: GameMeta[] = [
  { id:"blackjack",name:"Blackjack",kicker:"DIE KUNST DER HAND",description:"Eine stille Partie am grünen Filz. Fünf Karten, ein Tisch, ein Moment.",accent:"gold",icon:"♠",route:"/blackjack" },
  { id:"roulette",name:"Roulette",kicker:"DAS RAD DES ABENDS",description:"Messing, dunkles Holz und die ruhige Spannung vor dem letzten Fall.",accent:"gold",icon:"◉",route:"/roulette" },
  { id:"slots",name:"Slots",kicker:"DIE GOLDENE WALZE",description:"Drei Walzen im polierten Gehäuse. Ein klarer Blick auf jede Gewinnlinie.",accent:"gold",icon:"✦",route:"/slots" },
  { id:"dice",name:"Dice",kicker:"EIN WURF",description:"Elfenbein auf Casino-Filz. Wähle deine Seite und lies die Chance.",accent:"gold",icon:"⚄",route:"/dice" },
  { id:"plinko",name:"Plinko",kicker:"DER WEG NACH UNTEN",description:"Eine Kugel, eine Wand aus Messingpins und viele mögliche Wege.",accent:"gold",icon:"•",route:"/plinko" },
  { id:"baccarat",name:"Baccarat",kicker:"LE JEU",description:"Eine klassische Partie mit klaren Karten und ruhigem Tempo.",accent:"gold",icon:"K",route:"/baccarat" },
  { id:"hilo",name:"Hi-Lo",kicker:"DIE NÄCHSTE KARTE",description:"Höher oder tiefer? Folge deiner Hand und zahle sie aus, wann du willst.",accent:"gold",icon:"A",route:"/hilo" },
  { id:"wheel",name:"Wheel",kicker:"DAS LETZTE DREHEN",description:"Ein Rad aus zwölf Segmenten mit offen sichtbaren Multiplikatoren.",accent:"gold",icon:"✺",route:"/wheel" },
  { id:"mines",name:"Mines",kicker:"FELD FÜR FELD",description:"Öffne Edelsteine, erhöhe den Wert und zahle vor der Mine aus.",accent:"gold",icon:"◆",route:"/mines" },
  { id:"crash",name:"Crash",kicker:"BIS ZUM MOMENT",description:"Der Wert steigt – der Ausstieg liegt ganz bei dir.",accent:"gold",icon:"↗",route:"/crash" },
  { id:"limbo",name:"Limbo",kicker:"ÜBER DEM ZIEL",description:"Setze einen Multiplikator und springe mit einem Wurf darüber.",accent:"gold",icon:"×",route:"/limbo" },
  { id:"keno",name:"Keno",kicker:"ZEHN ZIEHUNGEN",description:"Markiere deine Zahlen und verfolge die stille Ziehung.",accent:"gold",icon:"10",route:"/keno" },
  { id:"video-poker",name:"Video Poker",kicker:"FÜNF KARTEN",description:"Halte deine Hand und ziehe auf die beste Kombination.",accent:"gold",icon:"♣",route:"/video-poker" },
  { id:"dragon-tiger",name:"Dragon Tiger",kicker:"ZWEI KARTEN",description:"Ein reduziertes Kartenduell zwischen Drache und Tiger.",accent:"gold",icon:"D",route:"/dragon-tiger" },
  { id:"coinflip",name:"Coin Flip",kicker:"KOPF ODER ZAHL",description:"Eine klare Wahl, ein kurzer Wurf und ein offenes Ergebnis.",accent:"gold",icon:"◐",route:"/coinflip" },
];
export function Lobby(){
 const {balance}=useTokens(); const reduced=useReducedMotion();
 return <main className="lobby-page">
  <section className="lobby-hero" id="top"><LobbyScene/><div className="hero-shade"/><div className="hero-content content-width">
   <motion.div className="hero-copy" initial={reduced?false:{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{duration:.8}}>
    <div className="private-label"><Sparkles size={13}/> EIN PRIVATER SPIELABEND</div><h1>Eine Nacht<br/>für <em>die Sinne.</em></h1>
    <p>Willkommen im NOCTURNE CLUB. Nimm Platz, entdecke die Spielräume und genieße den Abend in deinem Tempo.</p>
    <div className="hero-actions"><a className="primary-button" href="#blackjack">Den Club betreten <ArrowDown size={16}/></a><span className="hero-balance"><Coins size={16}/>{formatTokens(balance)} TOKEN</span></div>
   </motion.div><div className="hero-scroll-hint"><span/>Ein ruhiger Abend beginnt weiter unten</div>
  </div></section>
  <div className="film-intro content-width"><span>NOCTURNE CLUB <i>·</i> MAISON DE JEU</span><p>Warmes Licht. Poliertes Holz. Der vertraute Klang einer Karte auf Filz.</p></div>
  <LobbyJourney games={games.slice(0,8)}/>
  <section className="club-values content-width"><div><span className="feature-kicker">DER CLUB-GEDANKE</span><h2>Nur das Spiel.<br/><em>Nur für den Moment.</em></h2></div><div className="value-list"><p><ShieldCheck size={19}/><span><b>Virtuelle Tokens</b><br/>Ohne Echtgeldwert. Ohne Käufe. Ohne Auszahlungen.</span></p><p><Coins size={19}/><span><b>Ein lokaler Abend</b><br/>1.000 Tokens zum Start. Beim Reload beginnt die Sitzung neu.</span></p><p><Gamepad2 size={19}/><span><b>Spiel in deinem Tempo</b><br/>Kein Zeitdruck und kein Anreiz, weiterzuspielen.</span></p></div></section>
  <section className="game-directory content-width" id="spiele"><div className="directory-heading"><span className="feature-kicker">ALLE SPIELRÄUME</span><h2>Finde deinen <em>Tisch.</em></h2><p>Wähle ein Spiel und tritt direkt ein.</p></div><div className="directory-grid">{games.map((game,index)=><Link className="directory-link" to={game.route} key={game.id}><span className="directory-index">0{index+1}</span><span>{game.name}</span><ArrowRight size={16}/></Link>)}</div><p className="token-disclaimer">Nur virtuelle Tokens – kein Echtgeldwert</p></section>
 </main>
}
