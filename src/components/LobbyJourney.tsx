import { Canvas, useFrame } from "@react-three/fiber";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
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

function ScrollCards({ progress, index, baccarat = false }: { progress: { get: () => number }; index: number; baccarat?: boolean }) {
  const group = useRef<THREE.Group>(null);
  useFrame(() => {
    if (!group.current) return;
    const p = progress.get(); const center = (index + .5) / 8; const local = THREE.MathUtils.clamp((p - (center - .085)) / .17, 0, 1);
    const fan = Math.sin(local * Math.PI); const spring = Math.max(0, 1 - Math.abs(local - .52) * 5);
    group.current.children.forEach((card, i) => {
      const offset = i - 1; card.position.x = offset * (.32 + fan * .72); card.position.y = Math.abs(offset) * .06 + spring * (i === 1 ? .95 : .36);
      card.position.z = Math.abs(offset) * -.12 + spring * (i === 1 ? .85 : .15); card.rotation.z = offset * (-.18 - fan * .48); card.rotation.x = spring * (i === 1 ? -.3 : .08);
    });
  });
  return <group ref={group} position={[0, .15, -index * 10]}>
    <Card rank={baccarat ? "9" : "A"} suit={baccarat ? "♣" : "♠"} position={[-.32, 0, 0]}/>
    <Card rank={baccarat ? "K" : "Q"} suit={baccarat ? "♥" : "♦"} position={[0, 0, .03]}/>
    <Card rank={baccarat ? "4" : "7"} suit="♣" position={[.32, 0, -.02]}/>
  </group>;
}

function Dice({ index, progress }: { index: number; progress: { get: () => number } }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, delta) => { if (!ref.current) return; const p = progress.get(); const center = (index + .5) / 8; const local = THREE.MathUtils.clamp((p - center + .09) / .18, 0, 1); ref.current.rotation.x = THREE.MathUtils.damp(ref.current.rotation.x, local * Math.PI * 2.5, 6, delta); ref.current.rotation.y = THREE.MathUtils.damp(ref.current.rotation.y, local * Math.PI * 3, 6, delta); ref.current.position.y = -.35 + Math.sin(local * Math.PI) * 1.15; });
  return <group ref={ref} position={[0, -.35, -index * 10]}><mesh castShadow><boxGeometry args={[1.35, 1.35, 1.35]}/><meshStandardMaterial color="#eee4cc" roughness={.28}/></mesh><mesh position={[0, 0, .69]}><planeGeometry args={[.9,.9]}/><meshBasicMaterial color="#382a1a"/></mesh></group>;
}

function Slots({ index, progress }: { index: number; progress: { get: () => number } }) {
  const reels = useRef<THREE.Group>(null);
  useFrame((_, delta) => { if (!reels.current) return; const p = progress.get(); const local = THREE.MathUtils.clamp((p - (index + .18) / 8) / .1, 0, 1); reels.current.children.forEach((reel, i) => { const spin = Math.max(0, 1 - Math.abs(local - (.3 + i * .16)) * 4); reel.rotation.y = THREE.MathUtils.damp(reel.rotation.y, spin * Math.PI * 7, 5, delta); }); });
  return <group position={[0, 0, -index * 10]}><mesh castShadow><boxGeometry args={[4.1, 3.5, .55]}/><meshStandardMaterial color="#4b3420" metalness={.72} roughness={.28}/></mesh><mesh position={[0, 0, .31]}><boxGeometry args={[3.45, 2.25, .12]}/><meshStandardMaterial color="#10150f"/></mesh><group ref={reels}>{[-1.05,0,1.05].map((x,i)=><group key={i} position={[x,0,.42]}><mesh><cylinderGeometry args={[.48,.48,.16,48]}/><meshStandardMaterial color="#dfc17d" metalness={.64}/></mesh><mesh position={[0,0,.1]}><planeGeometry args={[.75,.75]}/><meshBasicMaterial color={i===1?"#bd8c3e":"#e4d3a7"}/></mesh></group>)}</group></group>;
}

function Plinko({ index, progress }: { index: number; progress: { get: () => number } }) {
  const ball = useRef<THREE.Mesh>(null);
  useFrame(() => { if (!ball.current) return; const p = progress.get(); const local = THREE.MathUtils.clamp((p - (index + .08) / 8) / .12, 0, 1); ball.current.position.set(Math.sin(local * 18) * .92, 2.3 - local * 4.3, .4); });
  return <group position={[0, 0, -index * 10]}><mesh><boxGeometry args={[3.8,5,.16]}/><meshStandardMaterial color="#27352a" metalness={.4}/></mesh>{Array.from({length:6},(_,row)=>Array.from({length:row+3},(_,col)=><mesh key={`${row}-${col}`} position={[(col-(row+2)/2)*.45,1.7-row*.58,.13]}><sphereGeometry args={[.075,12,12]}/><meshStandardMaterial color="#d1ad68" metalness={.85}/></mesh>))}<mesh ref={ball}><sphereGeometry args={[.18,24,24]}/><meshStandardMaterial color="#fff0bf" metalness={.72} emissive="#a57936" emissiveIntensity={.3}/></mesh></group>;
}

function Wheel({ index, progress }: { index: number; progress: { get: () => number } }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, delta) => { if (!ref.current) return; const p = progress.get(); const local = THREE.MathUtils.clamp((p - (index + .12) / 8) / .12, 0, 1); ref.current.rotation.z = THREE.MathUtils.damp(ref.current.rotation.z, local * Math.PI * 5, 4, delta); });
  return <group ref={ref} position={[0,0,-index*10]}><mesh><cylinderGeometry args={[2,2,.35,48]}/><meshStandardMaterial color="#b9904b" metalness={.85}/></mesh><mesh><cylinderGeometry args={[1.8,1.8,.38,12]}/><meshStandardMaterial color="#762f28" metalness={.25}/></mesh><mesh><cylinderGeometry args={[.42,.42,.42,32]}/><meshStandardMaterial color="#dfc17d" metalness={.8}/></mesh></group>;
}

function CameraJourney({ progress }: { progress: { get: () => number } }) {
  const curve = useMemo(() => new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, .3, 12), new THREE.Vector3(0, .25, 6), new THREE.Vector3(-.55, .12, -6), new THREE.Vector3(.45, .22, -18), new THREE.Vector3(0, .2, -30), new THREE.Vector3(-.5, .1, -42), new THREE.Vector3(.45, .18, -54), new THREE.Vector3(0, .25, -66), new THREE.Vector3(0, .25, -78),
  ]), []);
  const current = useRef(0);
  useFrame(({ camera }, delta) => { current.current += (progress.get() - current.current) * .08; const t = THREE.MathUtils.clamp(current.current, 0, 1); const position = curve.getPoint(t); const look = curve.getPoint(Math.min(.999, t + .025)); camera.position.lerp(position, Math.min(1, delta * 8)); camera.lookAt(look); });
  return null;
}

function World({ progress }: { progress: { get: () => number } }) {
  return <>
    <color attach="background" args={["#080907"]}/><fog attach="fog" args={["#080907",12,34]}/>
    <ambientLight intensity={1.1}/><directionalLight position={[-4,8,5]} intensity={3.2} color="#ffe4b0" castShadow/><pointLight position={[2,3,-12]} intensity={70} distance={24} color="#b78842"/><pointLight position={[-3,2,-42]} intensity={48} distance={20} color="#3f7651"/>
    <mesh rotation={[-Math.PI/2,0,0]} position={[0,-2.5,-35]}><planeGeometry args={[12,100]}/><meshStandardMaterial color="#10271c" roughness={.92}/></mesh>
    {Array.from({length:12},(_,i)=><group key={i} position={[0,0,-i*7]}><mesh position={[-5.7,1,0]}><cylinderGeometry args={[.14,.2,7,16]}/><meshStandardMaterial color="#815e2e" metalness={.75}/></mesh><mesh position={[5.7,1,0]}><cylinderGeometry args={[.14,.2,7,16]}/><meshStandardMaterial color="#815e2e" metalness={.75}/></mesh><pointLight position={[0,3.7,0]} intensity={9} distance={8} color="#d7ad68"/></group>)}
    <ScrollCards progress={progress} index={0}/><Slots index={1} progress={progress}/><Dice index={2} progress={progress}/><Plinko index={3} progress={progress}/><Wheel index={4} progress={progress}/><ScrollCards index={5} progress={progress} baccarat/><ScrollCards index={6} progress={progress}/><ScrollCards index={7} progress={progress} baccarat/>
    <CameraJourney progress={progress}/>
  </>;
}

function Caption({ game, index, progress }: { game: GameMeta; index: number; progress: ReturnType<typeof useScroll>["scrollYProgress"] }) {
  const start = index / 8; const fade = useTransform(progress, [Math.max(0,start-.015), start+.012, start+.082, Math.min(1,start+.105)], [0,1,1,0]);
  return <motion.div className={`journey-caption ${index%2?"right":""}`} style={{ opacity: fade }}><span>{String(index+1).padStart(2,"0")} · NOCTURNE CLUB</span><h2>{game.name}</h2><p>{game.description}</p><Link to={game.route}>Diesen Tisch betreten <ArrowRight size={16}/></Link></motion.div>;
}

export function LobbyJourney({ games }: { games: GameMeta[] }) {
  const ref = useRef<HTMLDivElement>(null); const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  return <section className="journey-shell" ref={ref} aria-label="Scroll-Reise durch die Spielwelten">
    <div className="journey-stage"><Canvas camera={{position:[0,.3,12],fov:48}} dpr={[1,1.5]} gl={{antialias:true,alpha:false,powerPreference:"high-performance"}}><World progress={scrollYProgress}/></Canvas><div className="journey-vignette"/>
      <div className="journey-captions">{games.map((game,index)=><Caption key={game.id} game={game} index={index} progress={scrollYProgress}/>)}</div>
      <div className="journey-progress" aria-hidden="true"><motion.i style={{scaleX:scrollYProgress,transformOrigin:"left"}}/></div>
    </div>
    <div className="journey-scroll-rail" aria-hidden="true">SCROLLE, UM DIE SPIELWELTEN ZU DURCHQUEREN</div>
    {reduced && <div className="motion-note">Reduzierte Bewegung ist aktiv. Die Spielauswahl findest du jederzeit im Menü.</div>}
  </section>;
}
