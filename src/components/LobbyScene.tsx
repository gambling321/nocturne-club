import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { useScroll, useTransform, motion } from "framer-motion";

function Room() {
  const group = useRef<THREE.Group>(null);
  const { scrollYProgress } = useScroll();
  const rotate = useTransform(scrollYProgress, [0, 1], [0.05, 1.8]);
  const rise = useTransform(scrollYProgress, [0, 1], [0, 1.4]);
  useEffect(() => {
    const update = () => {
      if (!group.current) return;
      group.current.rotation.y = rotate.get();
      group.current.position.y = rise.get();
    };
    const a = rotate.on("change", update);
    const b = rise.on("change", update);
    return () => { a(); b(); };
  }, [rotate, rise]);
  useFrame(({ clock }) => {
    if (group.current) group.current.rotation.x = Math.sin(clock.getElapsedTime() * 0.18) * 0.012;
  });
  return <group ref={group}>
    <ambientLight intensity={0.7} />
    <pointLight color="#e7bf77" intensity={38} distance={18} position={[-4, 5, 4]} />
    <pointLight color="#5d8b68" intensity={17} distance={13} position={[5, 0, 2]} />
    <mesh position={[0,-1.8,0]} rotation={[-Math.PI/2,0,0]}><cylinderGeometry args={[5,5,.2,64]} /><meshStandardMaterial color="#143b2b" roughness={.88} /></mesh>
    <mesh position={[0,-1.65,0]} rotation={[-Math.PI/2,0,0]}><torusGeometry args={[4.9,.13,8,64]} /><meshStandardMaterial color="#b59459" metalness={.78} roughness={.3} /></mesh>
    <mesh position={[0,-.96,0]} rotation={[-Math.PI/2,0,0]}><cylinderGeometry args={[1.8,1.8,.48,48]} /><meshStandardMaterial color="#24190f" roughness={.36} metalness={.16} /></mesh>
    <mesh position={[0,-.69,0]} rotation={[-Math.PI/2,0,0]}><torusGeometry args={[1.68,.08,10,48]} /><meshStandardMaterial color="#d2ad6e" metalness={.85} roughness={.24} /></mesh>
    <mesh position={[-1.65,-.5,.35]} rotation={[.15,.12,.08]}><boxGeometry args={[.84,1.16,.07]} /><meshStandardMaterial color="#efe6ce" roughness={.42} /></mesh>
    <mesh position={[-1.43,-.45,.25]} rotation={[.15,.24,.17]}><boxGeometry args={[.84,1.16,.07]} /><meshStandardMaterial color="#f8f1dd" roughness={.4} /></mesh>
    <mesh position={[2,-.7,.1]} rotation={[.22,.1,-.12]}><cylinderGeometry args={[.43,.43,.14,40]} /><meshStandardMaterial color="#c6a25e" metalness={.8} roughness={.25} /></mesh>
    {Array.from({length:12},(_,i)=>{const a=i*Math.PI/6;return <mesh key={i} position={[Math.cos(a)*4.1,-.55,Math.sin(a)*4.1]}><cylinderGeometry args={[.035,.035,2.4,8]}/><meshStandardMaterial color="#51371f" roughness={.4}/></mesh>;})}
  </group>;
}

function supported() { try { const c=document.createElement("canvas"); return !!(window.WebGLRenderingContext&&(c.getContext("webgl2")||c.getContext("webgl"))); } catch { return false; } }
export function LobbyScene() {
  const [webgl,setWebgl]=useState(false); const [reduced,setReduced]=useState(false);
  useEffect(()=>{setWebgl(supported());const q=matchMedia("(prefers-reduced-motion: reduce)");const sync=()=>setReduced(q.matches);sync();q.addEventListener("change",sync);return()=>q.removeEventListener("change",sync);},[]);
  if(!webgl||reduced)return <div className="lobby-scene fallback-scene" aria-hidden="true"><div className="scene-table"><span/><i/><b/></div><div className="scene-lamp"/></div>;
  return <motion.div className="lobby-scene" aria-hidden="true"><Canvas camera={{position:[0,1.6,9],fov:43}} dpr={[1,1.35]} gl={{antialias:true,alpha:true,powerPreference:"low-power"}}><Room/></Canvas></motion.div>;
}
