import { Canvas, useFrame } from "@react-three/fiber";
import { motion, useMotionValue, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import * as THREE from "three";
import type { GameMeta } from "../types";

function cardFace(rank: string, suit: string) {
  const canvas = document.createElement("canvas"); canvas.width = 256; canvas.height = 384;
  const ctx = canvas.getContext("2d")!; ctx.fillStyle = "#f3ead4"; ctx.fillRect(0, 0, 256, 384);
  ctx.strokeStyle = "#bc9b59"; ctx.lineWidth = 8; ctx.strokeRect(10, 10, 236, 364);
  ctx.fillStyle = suit === "♥" || suit === "♦" ? "#9e352c" : "#17251d";
  ctx.font = "bold 64px Georgia"; ctx.fillText(rank, 28, 78); ctx.font = "72px Georgia"; ctx.fillText(suit, 28, 155);
  ctx.font = "bold 126px Georgia"; ctx.textAlign = "center"; ctx.fillText(suit, 128, 250);
  ctx.font = "72px Georgia"; ctx.textAlign = "right"; ctx.fillText(suit, 228, 355); ctx.font = "bold 64px Georgia"; ctx.fillText(rank, 228, 315);
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; return texture;
}

function Card({ rank, suit, position, rotation = [0, 0, 0] as [number, number, number] }: { rank: string; suit: string; position: [number, number, number]; rotation?: [number, number, number] }) {
  const texture = useMemo(() => cardFace(rank, suit), [rank, suit]);
  return <mesh position={position} rotation={rotation} castShadow>
    <boxGeometry args={[1.05, 1.52, .035]}/>
    <meshStandardMaterial color="#ddc99b" roughness={.42} metalness={.12}/>
    <mesh position={[0, 0, .021]}><planeGeometry args={[.99, 1.46]}/><meshBasicMaterial map={texture} toneMapped={false}/></mesh>
    <mesh position={[0, 0, -.021]} rotation={[0, Math.PI, 0]}><planeGeometry args={[.99, 1.46]}/><meshStandardMaterial color="#1a2a22" roughness={.6}/></mesh>
  </mesh>;
}

function CasinoTable({ position = [0,0,0] as [number,number,number], roulette = false }: { position?: [number,number,number]; roulette?: boolean }) {
  return <group position={position}>
    <mesh position={[0,-.08,0]} scale={[1.8,1,.96]} castShadow><cylinderGeometry args={[1,.92,.22,64]}/><meshStandardMaterial color="#153f2c" roughness={.8}/></mesh>
    <mesh position={[0,-.2,0]} scale={[1.8,1,.96]}><cylinderGeometry args={[1.08,1.08,.16,64]}/><meshStandardMaterial color="#4c321c" metalness={.55} roughness={.35}/></mesh>
    <mesh position={[0,-.82,0]}><cylinderGeometry args={[.16,.2,.95,16]}/><meshStandardMaterial color="#5d4023" metalness={.6}/></mesh>
    {!roulette && <mesh position={[0,.045,0]} rotation={[-Math.PI/2,0,0]}><torusGeometry args={[1.25,.018,8,64]}/><meshStandardMaterial color="#c3a15d" metalness={.82}/></mesh>}
    {roulette && <group position={[.47,.12,0]} rotation={[-Math.PI/2,0,0]}><mesh><cylinderGeometry args={[.8,.8,.13,48]}/><meshStandardMaterial color="#a98444" metalness={.86}/></mesh><mesh position={[0,.071,0]}><cylinderGeometry args={[.68,.68,.025,24]}/><meshStandardMaterial color="#163928"/></mesh>{Array.from({length:12},(_,i)=><mesh key={i} rotation={[0,0,i*Math.PI/6]} position={[0,.09,0]}><torusGeometry args={[.57,.018,6,12,Math.PI/6]}/><meshStandardMaterial color={i%2?"#a7382d":"#d0b26f"} metalness={.65}/></mesh>)}<mesh position={[0,.12,0]}><cylinderGeometry args={[.17,.17,.08,24]}/><meshStandardMaterial color="#d0ad69" metalness={.86}/></mesh></group>}
  </group>;
}

function RouletteTable({ index }: { index: number }) {
  return <group position={[0,0,-index*10]}><CasinoTable roulette/><mesh position={[0,1.2,0]} rotation={[.12,0,0]}><boxGeometry args={[2.4,.06,.05]}/><meshStandardMaterial color="#c5a360" metalness={.75}/></mesh></group>;
}

function ScrollCards({ progress, index, baccarat = false }: { progress: { get: () => number }; index: number; baccarat?: boolean }) {
  const group = useRef<THREE.Group>(null);
  useFrame(() => {
    if (!group.current) return;
    const p = progress.get(); const center = (index + 1) / 9; const local = THREE.MathUtils.clamp((p - (center - .055)) / .11, 0, 1);
    const fan = Math.sin(local * Math.PI); const spring = Math.max(0, 1 - Math.abs(local - .52) * 5);
    group.current.children.forEach((card, i) => {
      const offset = i - 1; card.position.x = offset * (.32 + fan * .72); card.position.y = Math.abs(offset) * .06 + spring * (i === 1 ? .95 : .36);
      card.position.z = Math.abs(offset) * -.12 + spring * (i === 1 ? .85 : .15); card.rotation.z = offset * (-.18 - fan * .48); card.rotation.x = spring * (i === 1 ? -.3 : .08);
    });
  });
  return <group position={[0, .2, -index * 10]}>
    {index === 0 || index === 6 || baccarat ? <CasinoTable position={[0,-.72,0]} /> : null}
    <group ref={group}>
      <Card rank={baccarat ? "9" : index === 6 ? "7" : "A"} suit={baccarat ? "♣" : "♠"} position={[-.32, 0, 0]}/>
      <Card rank={baccarat ? "K" : index === 6 ? "K" : "Q"} suit={baccarat ? "♥" : "♦"} position={[0, 0, .03]}/>
      <Card rank={baccarat ? "4" : index === 6 ? "10" : "7"} suit="♣" position={[.32, 0, -.02]}/>
    </group>
  </group>;
}

function Dice({ index, progress }: { index: number; progress: { get: () => number } }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, delta) => { if (!ref.current) return; const p = progress.get(); const center = (index + 1) / 9; const local = THREE.MathUtils.clamp((p - center + .055) / .11, 0, 1); ref.current.rotation.x = THREE.MathUtils.damp(ref.current.rotation.x, local * Math.PI * 2.5, 6, delta); ref.current.rotation.y = THREE.MathUtils.damp(ref.current.rotation.y, local * Math.PI * 3, 6, delta); ref.current.position.y = -.35 + Math.sin(local * Math.PI) * 1.15; });
  return <group ref={ref} position={[0, -.35, -index * 10]}><mesh castShadow><boxGeometry args={[1.35, 1.35, 1.35]}/><meshStandardMaterial color="#eee4cc" roughness={.28}/></mesh><mesh position={[0, 0, .69]}><planeGeometry args={[.9,.9]}/><meshBasicMaterial color="#382a1a"/></mesh></group>;
}

function Slots({ index, progress }: { index: number; progress: { get: () => number } }) {
  const reels = useRef<THREE.Group>(null);
  useFrame((_, delta) => { if (!reels.current) return; const p = progress.get(); const center = (index + 1) / 9; const local = THREE.MathUtils.clamp((p - center + .06) / .12, 0, 1); reels.current.children.forEach((reel, i) => { const spin = Math.max(0, 1 - Math.abs(local - (.3 + i * .16)) * 4); reel.rotation.x = THREE.MathUtils.damp(reel.rotation.x, spin * Math.PI * 8, 5, delta); }); });
  return <group position={[0, .1, -index * 10]} rotation={[0,-.16,0]}><mesh castShadow><boxGeometry args={[3.8, 3.8, .8]}/><meshStandardMaterial color="#54351e" metalness={.72} roughness={.25}/></mesh><mesh position={[0, -.1, .43]}><boxGeometry args={[3.22, 2.5, .12]}/><meshStandardMaterial color="#10150f"/></mesh><mesh position={[0,1.35,.44]}><boxGeometry args={[2.8,.42,.08]}/><meshStandardMaterial color="#c59b53" emissive="#7b4d1e" emissiveIntensity={.24}/></mesh><group ref={reels} position={[0,-.1,.55]}>{[-1.03,0,1.03].map((x,i)=><group key={i} position={[x,0,0]}><mesh><cylinderGeometry args={[.42,.42,.14,48]}/><meshStandardMaterial color="#dfc17d" metalness={.64}/></mesh><mesh position={[0,0,.09]}><planeGeometry args={[.7,.7]}/><meshBasicMaterial color={i===1?"#bd8c3e":"#e4d3a7"}/></mesh></group>)}</group></group>;
}

function Plinko({ index, progress }: { index: number; progress: { get: () => number } }) {
  const ball = useRef<THREE.Mesh>(null);
  useFrame(() => { if (!ball.current) return; const p = progress.get(); const center = (index + 1) / 9; const local = THREE.MathUtils.clamp((p - center + .055) / .11, 0, 1); ball.current.position.set(Math.sin(local * 18) * .92, 3.35 - local * 4.3, .4); });
  return <group position={[0, 0, -index * 10]}><CasinoTable/><mesh position={[0,1.5,0]}><boxGeometry args={[3.1,4.7,.18]}/><meshStandardMaterial color="#39291a" metalness={.54}/></mesh><mesh position={[0,1.5,.11]}><boxGeometry args={[2.8,4.4,.06]}/><meshStandardMaterial color="#173f2c"/></mesh>{Array.from({length:7},(_,row)=>Array.from({length:row+2},(_,col)=><mesh key={`${row}-${col}`} position={[(col-(row+1)/2)*.39,3.35-row*.57,.18]}><sphereGeometry args={[.075,12,12]}/><meshStandardMaterial color="#d1ad68" metalness={.85}/></mesh>))}<mesh ref={ball}><sphereGeometry args={[.18,24,24]}/><meshStandardMaterial color="#fff0bf" metalness={.72} emissive="#a57936" emissiveIntensity={.3}/></mesh></group>;
}

function Wheel({ index, progress }: { index: number; progress: { get: () => number } }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, delta) => { if (!ref.current) return; const p = progress.get(); const center = (index + 1) / 9; const local = THREE.MathUtils.clamp((p - center + .055) / .11, 0, 1); ref.current.rotation.y = THREE.MathUtils.damp(ref.current.rotation.y, local * Math.PI * 5, 4, delta); });
  return <group ref={ref} position={[0,0,-index*10]}><mesh><cylinderGeometry args={[2,2,.35,48]}/><meshStandardMaterial color="#b9904b" metalness={.85}/></mesh><mesh><cylinderGeometry args={[1.8,1.8,.38,12]}/><meshStandardMaterial color="#762f28" metalness={.25}/></mesh><mesh><cylinderGeometry args={[.42,.42,.42,32]}/><meshStandardMaterial color="#dfc17d" metalness={.8}/></mesh></group>;
}

function CameraJourney({ target, smooth }: { target: { get: () => number }; smooth: { get: () => number; set: (value: number) => void } }) {
  const curve = useMemo(() => new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 2.1, 14), new THREE.Vector3(0, 1.45, 4), new THREE.Vector3(-2.25, 1.5, -6), new THREE.Vector3(2.1, 1.45, -16), new THREE.Vector3(-2.1, 1.5, -26), new THREE.Vector3(2.2, 1.45, -36), new THREE.Vector3(-2.2, 1.5, -46), new THREE.Vector3(2.25, 1.45, -56), new THREE.Vector3(-1.8, 1.5, -66), new THREE.Vector3(0, 1.8, -78),
  ]), []);
  const current = useRef(0);
  useFrame(({ camera }) => {
    current.current += (target.get() - current.current) * .08;
    const t = THREE.MathUtils.clamp(current.current, 0, 1); smooth.set(t);
    camera.position.copy(curve.getPoint(t)); camera.lookAt(curve.getPoint(Math.min(.999, t + .022)));
    const segment = t * 9; const nearest = Math.round(segment); const local = segment - nearest;
    const zoom = Math.max(0, 1 - Math.abs(local) * 5);
    const perspective = camera as THREE.PerspectiveCamera; perspective.fov = 49 - zoom * 13; perspective.updateProjectionMatrix();
  });
  return null;
}

function World({ progress, target }: { progress: { get: () => number; set: (value: number) => void }; target: { get: () => number } }) {
  return <>
    <color attach="background" args={["#100c08"]}/><fog attach="fog" args={["#100c08",18,52]}/>
    <ambientLight intensity={1.35}/><directionalLight position={[-4,9,8]} intensity={3.7} color="#ffe5b7" castShadow/><pointLight position={[0,4,-8]} intensity={85} distance={20} color="#dfa74e"/><pointLight position={[0,4,-34]} intensity={80} distance={21} color="#e3ac54"/><pointLight position={[0,4,-58]} intensity={75} distance={20} color="#d5a24e"/>
    <mesh rotation={[-Math.PI/2,0,0]} position={[0,-2.5,-33]}><planeGeometry args={[13,100]}/><meshStandardMaterial color="#193a29" roughness={.86}/></mesh>
    <mesh position={[0,6.4,-33]}><boxGeometry args={[13,.45,100]}/><meshStandardMaterial color="#1a130d" metalness={.32} roughness={.55}/></mesh>
    {[-6.35,6.35].map((x)=><mesh key={x} position={[x,2,-33]}><boxGeometry args={[.35,9,100]}/><meshStandardMaterial color="#342317" metalness={.28} roughness={.58}/></mesh>)}
    {Array.from({length:10},(_,i)=><group key={i} position={[0,0,3-i*9]}>
      {[-5.75,5.75].map((x)=><group key={x} position={[x,0,0]}><mesh position={[0,2.1,0]}><cylinderGeometry args={[.27,.36,8.6,20]}/><meshStandardMaterial color="#70471f" metalness={.68} roughness={.3}/></mesh><mesh position={[0,4.25,0]}><cylinderGeometry args={[.42,.38,.2,24]}/><meshStandardMaterial color="#d5a85e" metalness={.85}/></mesh><pointLight position={[x<0?.5:-.5,3.4,.25]} intensity={17} distance={7} color="#ffc86a"/></group>)}
      <mesh position={[0,5.65,0]}><cylinderGeometry args={[.055,.055,1.3,12]}/><meshStandardMaterial color="#bd9853" metalness={.85}/></mesh>
      <mesh position={[0,4.85,0]} rotation={[-Math.PI/2,0,0]}><torusGeometry args={[.68,.075,10,40]}/><meshStandardMaterial color="#c5a15d" metalness={.8}/></mesh>
      <pointLight position={[0,4.75,0]} intensity={26} distance={9} color="#ffd47d"/>
    </group>)}
    <ScrollCards progress={progress} index={0}/><RouletteTable index={1}/><Slots index={2} progress={progress}/><Dice index={3} progress={progress}/><Plinko index={4} progress={progress}/><ScrollCards index={5} progress={progress} baccarat/><ScrollCards index={6} progress={progress}/><Wheel index={7} progress={progress}/>
    <CameraJourney target={target} smooth={progress}/>
  </>;
}

function Caption({ game, index, progress }: { game: GameMeta; index: number; progress: ReturnType<typeof useScroll>["scrollYProgress"] }) {
  const center = (index + 1) / 9; const fade = useTransform(progress, [Math.max(0,center-.055), center-.025, center+.025, Math.min(1,center+.055)], [0,1,1,0]);
  return <motion.div className={`journey-caption ${index%2?"right":""}`} style={{ opacity: fade }}><span>{String(index+1).padStart(2,"0")} · NOCTURNE CLUB</span><h2>{game.name}</h2><p>{game.description}</p><Link to={game.route}>Diesen Tisch betreten <ArrowRight size={16}/></Link></motion.div>;
}

export function LobbyJourney({ games }: { games: GameMeta[] }) {
  const ref = useRef<HTMLDivElement>(null); const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const smoothProgress = useMotionValue(0);
  return <section className="journey-shell" ref={ref} aria-label="Scroll-Reise durch die Spielwelten">
    <div className="journey-stage"><Canvas camera={{position:[0,2.1,14],fov:49}} dpr={[1,1.5]} gl={{antialias:true,alpha:false,powerPreference:"high-performance"}}><World progress={smoothProgress} target={scrollYProgress}/></Canvas><div className="journey-vignette"/>
      <div className="journey-captions">{games.map((game,index)=><Caption key={game.id} game={game} index={index} progress={smoothProgress}/>)}</div>
      <div className="journey-progress" aria-hidden="true"><motion.i style={{scaleX:smoothProgress,transformOrigin:"left"}}/></div>
    </div>
    <div className="journey-scroll-rail" aria-hidden="true">SCROLLE, UM DIE SPIELWELTEN ZU DURCHQUEREN</div>
    {reduced && <div className="motion-note">Reduzierte Bewegung ist aktiv. Die Spielauswahl findest du jederzeit im Menü.</div>}
  </section>;
}
