import { Canvas, useFrame } from "@react-three/fiber";
import { motion, useMotionValue, useScroll, useTransform } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
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

function cardBackFace() {
  const canvas=document.createElement("canvas");canvas.width=256;canvas.height=384;const ctx=canvas.getContext("2d")!;
  ctx.fillStyle="#10261d";ctx.fillRect(0,0,256,384);ctx.strokeStyle="#c7a25f";ctx.lineWidth=7;ctx.strokeRect(10,10,236,364);ctx.lineWidth=2;ctx.strokeRect(19,19,218,346);
  ctx.save();ctx.beginPath();ctx.rect(24,24,208,336);ctx.clip();ctx.strokeStyle="#b8995b66";ctx.lineWidth=2;
  for(let x=-200;x<400;x+=22){ctx.beginPath();ctx.moveTo(x,24);ctx.lineTo(x+336,360);ctx.stroke();ctx.beginPath();ctx.moveTo(x,360);ctx.lineTo(x+336,24);ctx.stroke();}
  ctx.restore();ctx.beginPath();ctx.arc(128,192,56,0,Math.PI*2);ctx.strokeStyle="#d6b676";ctx.lineWidth=4;ctx.stroke();ctx.fillStyle="#e2c786";ctx.font="bold 67px Georgia";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText("♠",128,195);
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;return texture;
}

function BeveledBox({ args, position = [0,0,0], color, metalness = .1, roughness = .35, castShadow = false }: { args: [number,number,number,number,number]; position?: [number,number,number]; color: THREE.ColorRepresentation; metalness?: number; roughness?: number; castShadow?: boolean }) {
  const [width,height,depth,radius,segments]=args;
  const geometry=useMemo(()=>new RoundedBoxGeometry(width,height,depth,radius,segments),[width,height,depth,radius,segments]);
  return <mesh geometry={geometry} position={position} castShadow={castShadow}><meshStandardMaterial color={color} metalness={metalness} roughness={roughness}/></mesh>;
}

function Card({ rank, suit, position, rotation = [0, 0, 0] as [number, number, number] }: { rank: string; suit: string; position: [number, number, number]; rotation?: [number, number, number] }) {
  const texture = useMemo(() => cardFace(rank, suit), [rank, suit]);
  const back = useMemo(cardBackFace, []);
  return <mesh position={position} rotation={rotation} castShadow>
    <boxGeometry args={[1.05, 1.52, .035]}/>
    <meshStandardMaterial color="#ddc99b" roughness={.42} metalness={.12}/>
    <mesh position={[0, 0, .021]}><planeGeometry args={[.99, 1.46]}/><meshBasicMaterial map={texture} toneMapped={false}/></mesh>
    <mesh position={[0, 0, -.021]} rotation={[0, Math.PI, 0]}><planeGeometry args={[.99, 1.46]}/><meshBasicMaterial map={back} toneMapped={false}/></mesh>
  </mesh>;
}

function marqueeTexture() {
  const canvas = document.createElement("canvas"); canvas.width = 512; canvas.height = 192;
  const ctx = canvas.getContext("2d")!; ctx.fillStyle = "#1b120b"; ctx.fillRect(0,0,512,192);
  ctx.strokeStyle = "#d7b565"; ctx.lineWidth = 8; ctx.strokeRect(8,8,496,176);
  ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillStyle = "#f1d28b"; ctx.font = "italic 68px Georgia"; ctx.fillText("NOCTURNE",256,83);
  ctx.fillStyle = "#c69a4f"; ctx.font = "bold 24px Georgia"; ctx.fillText("LUXURY SLOT CLUB",256,147);
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; return texture;
}

function rouletteLayoutTexture() {
  const canvas=document.createElement("canvas");canvas.width=1024;canvas.height=384;const ctx=canvas.getContext("2d")!;
  ctx.fillStyle="#17412e";ctx.fillRect(0,0,1024,384);ctx.strokeStyle="#d2b06b";ctx.lineWidth=5;ctx.strokeRect(8,8,1008,368);
  const reds=new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);
  const left=94,top=20,width=900/12,height=344/3;
  for(let row=0;row<3;row++)for(let col=0;col<12;col++){
    const n=col*3+(3-row);const x=left+col*width,y=top+row*height;
    ctx.fillStyle=reds.has(n)?"#9c3027":"#141814";ctx.fillRect(x,y,width,height);ctx.strokeStyle="#d9c18d";ctx.lineWidth=2;ctx.strokeRect(x,y,width,height);
    ctx.fillStyle="#f2e7cb";ctx.font="bold 26px Georgia";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText(String(n),x+width/2,y+height/2);
  }
  ctx.fillStyle="#17503a";ctx.fillRect(20,top,68,height*3);ctx.strokeStyle="#d9c18d";ctx.strokeRect(20,top,68,height*3);ctx.save();ctx.translate(54,top+height*1.5);ctx.rotate(-Math.PI/2);ctx.fillStyle="#f2e7cb";ctx.font="bold 25px Georgia";ctx.textAlign="center";ctx.fillText("0",0,0);ctx.restore();
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;return texture;
}

function slotSymbolTexture(label: string, accent: string) {
  const canvas=document.createElement("canvas");canvas.width=256;canvas.height=256;const ctx=canvas.getContext("2d")!;
  const gradient=ctx.createLinearGradient(0,0,0,256);gradient.addColorStop(0,"#f4e8ca");gradient.addColorStop(.5,"#e2d2af");gradient.addColorStop(1,"#c9b58c");ctx.fillStyle=gradient;ctx.fillRect(0,0,256,256);
  const glow=ctx.createRadialGradient(128,120,4,128,128,112);glow.addColorStop(0,"#ffffff55");glow.addColorStop(1,"#ffffff00");ctx.fillStyle=glow;ctx.fillRect(0,0,256,256);
  ctx.fillStyle=accent;ctx.textAlign="center";ctx.textBaseline="middle";ctx.font=label.length>3?"bold 31px Georgia":"bold 104px Georgia";ctx.shadowColor="#6a452644";ctx.shadowBlur=4;ctx.fillText(label,128,128);
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;return texture;
}

function wheelLabelTexture(label: string) {
  const canvas=document.createElement("canvas");canvas.width=256;canvas.height=128;const ctx=canvas.getContext("2d")!;
  ctx.fillStyle="#f7e9c8";ctx.textAlign="center";ctx.textBaseline="middle";ctx.font="bold 58px Georgia";ctx.shadowColor="#000";ctx.shadowBlur=5;ctx.fillText(label,128,66);
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;return texture;
}

function CasinoTable({ position = [0,0,0] as [number,number,number] }: { position?: [number,number,number] }) {
  return <group position={position}>
    <mesh position={[0,-.08,0]} scale={[1.8,1,.96]} castShadow><cylinderGeometry args={[1,.92,.22,64]}/><meshStandardMaterial color="#153f2c" roughness={.8}/></mesh>
    <mesh position={[0,-.2,0]} scale={[1.8,1,.96]}><cylinderGeometry args={[1.08,1.08,.16,64]}/><meshStandardMaterial color="#4c321c" metalness={.55} roughness={.35}/></mesh>
    <mesh position={[0,-.82,0]}><cylinderGeometry args={[.16,.2,.95,16]}/><meshStandardMaterial color="#5d4023" metalness={.6}/></mesh>
    <mesh position={[0,.045,0]} rotation={[-Math.PI/2,0,0]}><torusGeometry args={[1.25,.018,8,64]}/><meshStandardMaterial color="#c3a15d" metalness={.72} roughness={.3}/></mesh>
  </group>;
}

function rouletteTexture() {
  const canvas = document.createElement("canvas"); canvas.width = 1024; canvas.height = 1024;
  const ctx = canvas.getContext("2d")!; ctx.translate(512,512);
  const reds = new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);
  for(let n=0;n<37;n++){const a=(n/37)*Math.PI*2-Math.PI/2,b=((n+1)/37)*Math.PI*2-Math.PI/2;ctx.beginPath();ctx.moveTo(0,0);ctx.arc(0,0,480,a,b);ctx.closePath();ctx.fillStyle=n===0?"#174b35":reds.has(n)?"#992e25":"#171815";ctx.fill();ctx.strokeStyle="#d5b875";ctx.lineWidth=3;ctx.stroke();ctx.save();ctx.rotate((a+b)/2);ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillStyle="#f6e8c7";ctx.font="bold 25px Georgia";ctx.fillText(String(n),0,-440);ctx.restore();}
  for(const radius of [330,270,205,135]){ctx.beginPath();ctx.arc(0,0,radius,0,Math.PI*2);ctx.strokeStyle="#dfbd72";ctx.lineWidth=5;ctx.stroke();}
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;return texture;
}

function RouletteTable({ index, progress }: { index: number; progress: { get: () => number } }) {
  const wheel=useRef<THREE.Group>(null);const ball=useRef<THREE.Mesh>(null);const felt=useMemo(rouletteTexture,[]);const layout=useMemo(rouletteLayoutTexture,[]);
  useFrame(()=>{const center=(index+1)/9;const phase=THREE.MathUtils.clamp((progress.get()-(center-.055))/.11,0,1);if(wheel.current)wheel.current.rotation.y=THREE.MathUtils.smoothstep(phase,0,1)*Math.PI*5;if(ball.current){const angle=.2-phase*Math.PI*11;ball.current.position.set(.47+Math.cos(angle)*.65,.27+Math.sin(phase*Math.PI)*.045,Math.sin(angle)*.65);}});
  return <group position={[2.3,-.9,-index*10]} scale={1.22}>
    <CasinoTable/>
    <mesh position={[-.66,.042,.38]} rotation={[-Math.PI/2,0,0]}><planeGeometry args={[1.58,.68]}/><meshBasicMaterial map={layout} toneMapped={false}/></mesh>
    <mesh position={[.47,.164,0]} rotation={[-Math.PI/2,0,0]}><circleGeometry args={[.78,96]}/><meshBasicMaterial map={felt} toneMapped={false}/></mesh>
    <mesh position={[.47,.095,0]}><cylinderGeometry args={[.8,.84,.13,96]}/><meshStandardMaterial color="#59391e" metalness={.56} roughness={.27}/></mesh>
    <group ref={wheel} position={[.47,.17,0]}>
      <mesh rotation={[-Math.PI/2,0,0]}><torusGeometry args={[.8,.055,12,96]}/><meshStandardMaterial color="#dbb568" metalness={.78} roughness={.25}/></mesh>
      <mesh rotation={[-Math.PI/2,0,0]}><torusGeometry args={[.54,.033,10,72]}/><meshStandardMaterial color="#d5ae63" metalness={.7} roughness={.28}/></mesh>
      <mesh position={[0,.025,0]}><cylinderGeometry args={[.19,.24,.09,32]}/><meshStandardMaterial color="#d4ac62" metalness={.72}/></mesh>
      <mesh position={[0,.09,0]}><sphereGeometry args={[.07,18,18]}/><meshStandardMaterial color="#fff0d0" metalness={.52} roughness={.18}/></mesh>
    </group>
    <mesh ref={ball}><sphereGeometry args={[.052,20,20]}/><meshStandardMaterial color="#fff0d0" metalness={.42} roughness={.15} emissive="#fff0d0" emissiveIntensity={.12}/></mesh>
  </group>;
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
  return <group position={[2.3, -.35, -index * 10]}>
    {index === 0 || index === 6 || baccarat ? <CasinoTable position={[0,-.85,0]} /> : null}
    <group ref={group}>
      <Card rank={baccarat ? "9" : index === 6 ? "7" : "A"} suit={baccarat ? "♣" : "♠"} position={[-.32, 0, 0]}/>
      <Card rank={baccarat ? "K" : index === 6 ? "K" : "Q"} suit={baccarat ? "♥" : "♦"} position={[0, 0, .03]}/>
      <Card rank={baccarat ? "4" : index === 6 ? "10" : "7"} suit="♣" position={[.32, 0, -.02]}/>
    </group>
  </group>;
}

function DicePips({ position, rotation, pips }: { position: [number,number,number]; rotation: [number,number,number]; pips: [number,number][] }) {
  return <group position={position} rotation={rotation}>{pips.map(([x,y],index)=><mesh key={index} position={[x,y,.012]}><sphereGeometry args={[.085,16,12]}/><meshStandardMaterial color="#352a20" roughness={.34}/></mesh>)}</group>;
}

function Dice({ index, progress }: { index: number; progress: { get: () => number } }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, delta) => { if (!ref.current) return; const p = progress.get(); const center = (index + 1) / 9; const local = THREE.MathUtils.clamp((p - center + .055) / .11, 0, 1); ref.current.rotation.x = THREE.MathUtils.damp(ref.current.rotation.x, local * Math.PI * 2.5, 6, delta); ref.current.rotation.y = THREE.MathUtils.damp(ref.current.rotation.y, local * Math.PI * 3, 6, delta); ref.current.position.y = -.35 + Math.sin(local * Math.PI) * 1.15; });
  return <group position={[2.3,0,-index*10]}>
    <mesh position={[0,-1.72,0]}><cylinderGeometry args={[.72,.9,1.56,48]}/><meshStandardMaterial color="#30231a" metalness={.46} roughness={.3}/></mesh>
    <mesh position={[0,-.9,0]}><cylinderGeometry args={[1.05,.96,.16,48]}/><meshStandardMaterial color="#ba9655" metalness={.72} roughness={.25}/></mesh>
    <group ref={ref} position={[0,-.35,0]}>
      <mesh castShadow><boxGeometry args={[1.35,1.35,1.35]}/><meshStandardMaterial color="#eee4cc" roughness={.24}/></mesh>
      <DicePips position={[0,0,.68]} rotation={[0,0,0]} pips={[[0,0]]}/><DicePips position={[0,0,-.68]} rotation={[0,Math.PI,0]} pips={[[-.32,.32],[.32,-.32]]}/>
      <DicePips position={[.68,0,0]} rotation={[0,Math.PI/2,0]} pips={[[-.32,.32],[0,0],[.32,-.32]]}/><DicePips position={[-.68,0,0]} rotation={[0,-Math.PI/2,0]} pips={[[-.32,.32],[-.32,-.32],[.32,.32],[.32,-.32]]}/>
      <DicePips position={[0,.68,0]} rotation={[-Math.PI/2,0,0]} pips={[[-.32,.32],[.32,.32],[0,0],[-.32,-.32],[.32,-.32]]}/><DicePips position={[0,-.68,0]} rotation={[Math.PI/2,0,0]} pips={[[-.32,.32],[-.32,0],[-.32,-.32],[.32,.32],[.32,0],[.32,-.32]]}/>
    </group>
  </group>;
}

function Slots({ index, progress }: { index: number; progress: { get: () => number } }) {
  const reels = useRef<THREE.Group>(null);
  const cabinet = useMemo(() => new RoundedBoxGeometry(3.45, 4.8, 1.3, .18, 5), []);
  const reelSymbols = useMemo(() => [
    ["7", "CHERRY", "BAR", "BELL", "7", "DIAMOND"],
    ["BELL", "7", "DIAMOND", "CHERRY", "BAR", "7"],
    ["BAR", "CHERRY", "7", "DIAMOND", "BELL", "7"],
  ].map((symbols) => symbols.map((symbol) => slotSymbolTexture(symbol, symbol === "7" ? "#a02e24" : "#203f31"))), []);
  const marquee = useMemo(marqueeTexture, []);
  useFrame(() => {
    const center = (index + 1) / 9; const local = THREE.MathUtils.clamp((progress.get() - (center - .065)) / .13, 0, 1);
    reels.current?.children.forEach((reel, i) => {
      const phase = THREE.MathUtils.clamp((local - i * .08) / .76, 0, 1);
      const eased = 1 - Math.pow(1 - phase, 3);
      reel.rotation.x = eased * Math.PI * 12;
    });
  });
  return <group position={[2.35,0,-index*10]} rotation={[0,-.08,0]} scale={1.04}>
    <mesh geometry={cabinet} castShadow receiveShadow><meshStandardMaterial color="#281a12" metalness={.16} roughness={.32}/></mesh>
    <BeveledBox position={[0,0,.64]} args={[3.12,4.48,.12,.12,4]} color="#512d19" metalness={.22} roughness={.3}/>
    <BeveledBox position={[0,-2.16,.12]} args={[3.72,.48,1.48,.16,5]} color="#633c20" metalness={.42} roughness={.29} castShadow/>
    <BeveledBox position={[0,-2.43,.12]} args={[3.22,.16,1.28,.07,4]} color="#bd9854" metalness={.74} roughness={.27}/>
    <BeveledBox position={[0,1.77,.72]} args={[2.96,.78,.18,.11,4]} color="#17120c" metalness={.34} roughness={.28}/>
    <mesh position={[0,1.77,.82]}><planeGeometry args={[2.7,.59]}/><meshBasicMaterial map={marquee} toneMapped={false}/></mesh>
    <BeveledBox position={[0,2.24,.55]} args={[2.42,.18,.42,.08,4]} color="#c39b52" metalness={.77} roughness={.24}/>
    {/* Three separate, curved symbol bands rotate on the same axis as real slot reels. */}
    <BeveledBox position={[0,.12,.72]} args={[2.88,2.08,.2,.14,5]} color="#c09b57" metalness={.7} roughness={.26}/>
    <BeveledBox position={[0,.12,.84]} args={[2.69,1.9,.11,.1,4]} color="#0b0d0b" metalness={.18} roughness={.26}/>
    <group ref={reels} position={[0,.12,.94]}>
      {[-.83,0,.83].map((x,reelIndex)=><group key={x} position={[x,0,0]}>
        <mesh rotation={[0,0,Math.PI/2]} castShadow><cylinderGeometry args={[.56,.56,.62,48]}/><meshStandardMaterial color="#b58c4c" metalness={.53} roughness={.3}/></mesh>
        {reelSymbols[reelIndex]!.map((texture,symbolIndex)=>{
          const angle=symbolIndex*Math.PI/3;
          return <mesh key={symbolIndex} position={[0,.62*Math.sin(angle),.62*Math.cos(angle)]} rotation={[-angle,0,0]}>
            <planeGeometry args={[.64,.76]}/><meshBasicMaterial map={texture} toneMapped={false} side={THREE.DoubleSide}/>
          </mesh>;
        })}
      </group>)}
    </group>
    <BeveledBox position={[0,-1.03,.78]} args={[2.82,.22,.22,.09,4]} color="#d3aa5c" metalness={.72} roughness={.24}/>
    <BeveledBox position={[0,-1.03,.91]} args={[2.42,.07,.05,.03,3]} color="#c89437" metalness={.12} roughness={.24}/>
    {[-.58,0,.58].map((x,i)=><group key={x} position={[x,-1.39,.82]}>
      <mesh rotation={[Math.PI/2,0,0]}><cylinderGeometry args={[.19,.19,.07,32]}/><meshStandardMaterial color="#b48c4d" metalness={.72} roughness={.25}/></mesh>
      <mesh position={[0,0,.045]} rotation={[Math.PI/2,0,0]}><cylinderGeometry args={[.135,.135,.025,32]}/><meshStandardMaterial color={i===1?"#9b3025":"#ead9b0"} metalness={.28} roughness={.24}/></mesh>
    </group>)}
    <group position={[1.89,.42,.12]}>
      <mesh position={[0,.21,0]} rotation={[0,0,-.2]}><cylinderGeometry args={[.07,.09,.7,20]}/><meshStandardMaterial color="#d5ad61" metalness={.78} roughness={.24}/></mesh>
      <mesh position={[-.08,.59,0]}><sphereGeometry args={[.19,28,24]}/><meshStandardMaterial color="#efe1c0" metalness={.25} roughness={.2}/></mesh>
      <mesh position={[0,-.15,0]}><cylinderGeometry args={[.22,.2,.15,28]}/><meshStandardMaterial color="#b5863d" metalness={.72} roughness={.25}/></mesh>
    </group>
    <BeveledBox position={[0,-1.72,.78]} args={[1.68,.38,.5,.12,5]} color="#322014" metalness={.34} roughness={.3}/>
    <mesh position={[0,-1.85,.97]} rotation={[-.15,0,0]}><cylinderGeometry args={[.58,.7,.13,40]}/><meshStandardMaterial color="#c89c4e" metalness={.72} roughness={.26}/></mesh>
  </group>;
}

function Plinko({ index, progress }: { index: number; progress: { get: () => number } }) {
  const ball = useRef<THREE.Mesh>(null);
  useFrame(() => { if (!ball.current) return; const p = progress.get(); const center = (index + 1) / 9; const local = THREE.MathUtils.clamp((p - center + .055) / .11, 0, 1); ball.current.position.set(Math.sin(local * 18) * .92, 3.35 - local * 4.3, .4); });
  return <group position={[2.3,-.15,-index*10]}>
    <mesh position={[0,-1.15,-.05]}><boxGeometry args={[.22,2.4,.34]}/><meshStandardMaterial color="#56351d" metalness={.36} roughness={.35}/></mesh>
    <mesh position={[0,-1.15,-.05]}><boxGeometry args={[2.9,.22,.72]}/><meshStandardMaterial color="#b58b4d" metalness={.66} roughness={.29}/></mesh>
    <BeveledBox position={[0,1.5,0]} args={[3.1,4.7,.22,.14,4]} color="#5a3920" metalness={.42} roughness={.3} castShadow/>
    <BeveledBox position={[0,1.5,.14]} args={[2.82,4.42,.08,.1,4]} color="#16412d" roughness={.82}/>
    {Array.from({length:8},(_,row)=>Array.from({length:row+2},(_,col)=><mesh key={`${row}-${col}`} position={[(col-(row+1)/2)*.39,3.35-row*.57,.22]}><sphereGeometry args={[.07,16,16]}/><meshStandardMaterial color="#d1ad68" metalness={.76} roughness={.25}/></mesh>))}
    <BeveledBox position={[0,-.99,.24]} args={[2.88,.52,.22,.11,4]} color="#2b1d13" metalness={.38}/>
    <mesh ref={ball}><sphereGeometry args={[.18,24,24]}/><meshStandardMaterial color="#fff0bf" metalness={.5} roughness={.16} emissive="#a57936" emissiveIntensity={.28}/></mesh>
  </group>;
}

function Wheel({ index, progress }: { index: number; progress: { get: () => number } }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(() => { if (!ref.current) return; const center = (index + 1) / 9; const phase = THREE.MathUtils.clamp((progress.get() - (center - .055)) / .11, 0, 1); ref.current.rotation.z = THREE.MathUtils.smoothstep(phase,0,1) * Math.PI * 8; });
  const multipliers=["2×","3×","5×","2×","10×","3×","2×","5×","20×","2×","3×","50×"];
  const labels=useMemo(()=>multipliers.map(wheelLabelTexture),[]);
  const wedges=useMemo(()=>Array.from({length:12},(_,i)=>{const shape=new THREE.Shape();const a=i*Math.PI/6;const b=(i+1)*Math.PI/6;shape.moveTo(0,0);shape.lineTo(Math.cos(a)*1.45,Math.sin(a)*1.45);shape.absarc(0,0,1.45,a,b,false);shape.closePath();return new THREE.ShapeGeometry(shape,16);}),[]);
  const colors=["#163c2c","#8e3025","#b08a4d","#1b211b","#74291f","#17432e","#b08a4d","#862f24","#162c22","#a78046","#6f281f","#15412f"];
  return <group position={[2.35,0,-index*10]} scale={1.05}>
    <mesh position={[0,-2.08,0]}><cylinderGeometry args={[.78,.92,.84,48]}/><meshStandardMaterial color="#382719" metalness={.47} roughness={.3}/></mesh>
    <mesh position={[0,-1.64,0]}><cylinderGeometry args={[1.06,.98,.16,48]}/><meshStandardMaterial color="#c09b55" metalness={.72} roughness={.25}/></mesh>
    <mesh position={[0,-.84,0]}><cylinderGeometry args={[.26,.34,1.52,32]}/><meshStandardMaterial color="#684321" metalness={.55} roughness={.29}/></mesh>
    <group ref={ref}>
      {wedges.map((geometry,i)=><mesh key={i} geometry={geometry} position={[0,0,.08]}><meshStandardMaterial color={colors[i]} roughness={.34} metalness={.22} side={THREE.DoubleSide}/></mesh>)}
      {labels.map((texture,i)=>{const angle=(i+.5)*Math.PI/6;return <mesh key={i} position={[Math.cos(angle)*.94,Math.sin(angle)*.94,.13]} rotation={[0,0,angle+Math.PI/2]}><planeGeometry args={[.38,.2]}/><meshBasicMaterial map={texture} transparent toneMapped={false}/></mesh>;})}
      <mesh><torusGeometry args={[1.48,.065,12,64]}/><meshStandardMaterial color="#dfbd72" metalness={.75} roughness={.23}/></mesh>
      <mesh position={[0,0,.12]}><circleGeometry args={[.3,40]}/><meshStandardMaterial color="#d7b56b" metalness={.74} roughness={.25}/></mesh>
      <mesh position={[0,0,.15]}><circleGeometry args={[.17,40]}/><meshStandardMaterial color="#292016" metalness={.62} roughness={.24}/></mesh>
      {Array.from({length:24},(_,i)=><mesh key={`pin-${i}`} position={[Math.cos(i*Math.PI/12)*1.38,Math.sin(i*Math.PI/12)*1.38,.14]}><sphereGeometry args={[.032,12,12]}/><meshStandardMaterial color="#f7e2a7" metalness={.74} roughness={.24}/></mesh>)}
    </group>
    <mesh position={[0,1.62,.1]} rotation={[0,0,Math.PI]}><coneGeometry args={[.15,.34,3]}/><meshStandardMaterial color="#e2c47b" metalness={.75} roughness={.24}/></mesh>
  </group>;
}

function CameraJourney({ target, smooth }: { target: { get: () => number }; smooth: { get: () => number; set: (value: number) => void } }) {
  const { cameraPath, focusPath } = useMemo(() => ({
    cameraPath: new THREE.CatmullRomCurve3([
      new THREE.Vector3(0,1.65,20),new THREE.Vector3(0,1.4,10),new THREE.Vector3(.22,1.4,0),new THREE.Vector3(-.2,1.4,-10),new THREE.Vector3(.22,1.4,-20),new THREE.Vector3(-.18,1.4,-30),new THREE.Vector3(.18,1.4,-40),new THREE.Vector3(-.18,1.4,-50),new THREE.Vector3(.12,1.4,-60),new THREE.Vector3(0,1.65,-82),
    ]),
    focusPath: new THREE.CatmullRomCurve3([
      new THREE.Vector3(1.25,.22,10),new THREE.Vector3(1.25,.22,0),new THREE.Vector3(1.25,.22,-10),new THREE.Vector3(1.25,.22,-20),new THREE.Vector3(1.25,.22,-30),new THREE.Vector3(1.25,.22,-40),new THREE.Vector3(1.25,.22,-50),new THREE.Vector3(1.25,.22,-60),new THREE.Vector3(1.25,.22,-70),new THREE.Vector3(1.25,.22,-80),
    ]),
  }), []);
  const current = useRef(0);
  useFrame(({ camera }) => {
    current.current += (target.get() - current.current) * .08;
    const t = THREE.MathUtils.clamp(current.current, 0, 1); smooth.set(t);
    camera.position.copy(cameraPath.getPoint(t)); camera.lookAt(focusPath.getPoint(t));
    const segment = t * 9; const nearest = Math.round(segment); const local = segment - nearest;
    const zoom = Math.max(0, 1 - Math.abs(local) * 5);
    const perspective = camera as THREE.PerspectiveCamera; perspective.fov = 49 - zoom * 11; perspective.updateProjectionMatrix();
  });
  return null;
}

function ProductStage({ index }: { index: number }) {
  return <group position={[2.3,-2.46,-index*10]}>
    <mesh rotation={[-Math.PI/2,0,0]}><circleGeometry args={[3.3,96]}/><meshBasicMaterial color="#c7a15c" transparent opacity={.025} toneMapped={false}/></mesh>
    <mesh rotation={[-Math.PI/2,0,0]}><torusGeometry args={[2.75,.012,6,96]}/><meshStandardMaterial color="#b89457" emissive="#7f5524" emissiveIntensity={.16} metalness={.48} roughness={.34}/></mesh>
    <pointLight position={[0,4.5,0]} intensity={27} distance={13} decay={2} color="#f1d4a0"/>
    <pointLight position={[-2.4,2.8,-1.8]} intensity={12} distance={9} decay={2} color="#9e733c"/>
  </group>;
}

function World({ progress, target }: { progress: { get: () => number; set: (value: number) => void }; target: { get: () => number } }) {
  return <>
    <color attach="background" args={["#090b09"]}/><fog attach="fog" args={["#090b09",9,19]}/>
    <ambientLight intensity={.42}/><hemisphereLight args={["#f0d7ae","#151914",.7]}/><directionalLight position={[-3,7,8]} intensity={2.5} color="#ffe8c7"/>
    <mesh rotation={[-Math.PI/2,0,0]} position={[0,-2.5,-34]}><planeGeometry args={[30,118]}/><meshStandardMaterial color="#0c100d" roughness={.88}/></mesh>
    {Array.from({length:8},(_,i)=><ProductStage key={i} index={i}/>)}
    <ScrollCards progress={progress} index={0}/><RouletteTable index={1} progress={progress}/><Slots index={2} progress={progress}/><Dice index={3} progress={progress}/><Plinko index={4} progress={progress}/><ScrollCards index={5} progress={progress} baccarat/><ScrollCards index={6} progress={progress}/><Wheel index={7} progress={progress}/>
    <CameraJourney target={target} smooth={progress}/>
  </>;
}

function Caption({ game, index, progress }: { game: GameMeta; index: number; progress: ReturnType<typeof useScroll>["scrollYProgress"] }) {
  const center = (index + 1) / 9; const start=Math.max(0,center-.055);const end=Math.min(1,center+.055);const fade = useTransform(progress, [start, center-.025, center+.025, end], [0,1,1,0]);const visibility=useTransform(progress,[start,Math.min(end,start+.002),Math.max(start,end-.002),end],["hidden","visible","visible","hidden"]);
  return <motion.div className="journey-caption" style={{ opacity: fade, visibility }}><span>{String(index+1).padStart(2,"0")} · SPIELWELT</span><h2>{game.name}</h2><p>{game.description}</p><Link to={game.route}>Spiel entdecken <ArrowRight size={16}/></Link></motion.div>;
}

export function LobbyJourney({ games }: { games: GameMeta[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const smoothProgress = useMotionValue(0);
  return <section className="journey-shell" ref={ref} aria-label="Scroll-Reise durch die Spielwelten">
    <div className="journey-stage"><Canvas fallback={<div className="journey-fallback"><p>Die 3D-Ansicht wird auf diesem Gerät nicht unterstützt.</p><div>{games.map((game) => <Link key={game.id} to={game.route}>{game.name}<ArrowRight size={14}/></Link>)}</div></div>} camera={{position:[0,1.65,20],fov:49}} dpr={[0.75,1.25]} gl={{antialias:false,alpha:false,powerPreference:"low-power",failIfMajorPerformanceCaveat:false}}><World progress={smoothProgress} target={scrollYProgress}/></Canvas><div className="journey-vignette"/>
      <div className="journey-captions">{games.map((game,index)=><Caption key={game.id} game={game} index={index} progress={smoothProgress}/>)}</div>
      <div className="journey-progress" aria-hidden="true"><motion.i style={{scaleX:smoothProgress,transformOrigin:"left"}}/></div>
    </div>
    <div className="journey-scroll-rail" aria-hidden="true">SCROLLE, UM DIE SPIELWELTEN ZU DURCHQUEREN</div>
  </section>;
}
