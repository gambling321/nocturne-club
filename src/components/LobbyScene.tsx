import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

function supportsWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(window.WebGLRenderingContext && (canvas.getContext("webgl2") || canvas.getContext("webgl")));
  } catch {
    return false;
  }
}

function Scene() {
  const group = useRef<THREE.Group>(null);
  const scrollPosition = useRef(0);

  useEffect(() => {
    const onScroll = () => { scrollPosition.current = window.scrollY; };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useFrame(({ clock }) => {
    if (!group.current) return;
    const t = clock.getElapsedTime();
    group.current.rotation.y = t * 0.08 + scrollPosition.current * 0.00014;
    group.current.rotation.x = Math.sin(t * 0.26) * 0.06;
    group.current.position.y = -scrollPosition.current * 0.00045;
  });

  return (
    <group ref={group}>
      <ambientLight intensity={1.4} />
      <pointLight color="#9d5cff" intensity={95} distance={22} position={[-5, 3, 5]} />
      <pointLight color="#2af6e3" intensity={70} distance={20} position={[5, -1, 4]} />
      <pointLight color="#f4c66d" intensity={42} distance={15} position={[0, 4, 1]} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.6, 0]}>
        <circleGeometry args={[8, 64]} />
        <meshStandardMaterial color="#06131c" metalness={0.84} roughness={0.24} />
      </mesh>
      <FloatingChip position={[-2.8, 0.7, -0.2]} color="#9d5cff" spin={0.6} />
      <FloatingChip position={[3.1, 1.15, -1.1]} color="#26e5d4" spin={-0.38} />
      <FloatingCard position={[-0.75, 1.75, -0.8]} rotation={[0.2, -0.44, 0.08]} color="#f7d58c" />
      <FloatingCard position={[1.35, -0.1, 1.5]} rotation={[-0.35, 0.66, -0.1]} color="#c276ff" />
      <Dice position={[0.4, -1.0, -0.3]} />
      <RouletteRing position={[1.85, -1.25, -0.6]} />
      {Array.from({ length: 18 }, (_, index) => <Star key={index} index={index} />)}
    </group>
  );
}

function FloatingChip({ position, color, spin }: { position: [number, number, number]; color: string; spin: number }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime();
    ref.current.rotation.x = Math.PI / 2.4 + t * spin;
    ref.current.rotation.z = Math.sin(t * 0.65 + position[0]) * 0.35;
    ref.current.position.y = position[1] + Math.sin(t * 0.9 + position[2]) * 0.22;
  });
  return <mesh ref={ref} position={position}><cylinderGeometry args={[0.75, 0.75, 0.15, 40]} /><meshStandardMaterial color={color} metalness={0.76} roughness={0.2} emissive={color} emissiveIntensity={0.18} /></mesh>;
}

function FloatingCard({ position, rotation, color }: { position: [number, number, number]; rotation: [number, number, number]; color: string }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime();
    ref.current.position.y = position[1] + Math.sin(t * 0.7 + position[0]) * 0.18;
    ref.current.rotation.y = rotation[1] + Math.cos(t * 0.42) * 0.14;
  });
  return <mesh ref={ref} position={position} rotation={rotation}><boxGeometry args={[0.9, 1.25, 0.08]} /><meshStandardMaterial color="#ecf7f7" metalness={0.42} roughness={0.22} emissive={color} emissiveIntensity={0.08} /></mesh>;
}

function Dice({ position }: { position: [number, number, number] }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime();
    ref.current.rotation.x = t * 0.34;
    ref.current.rotation.y = t * 0.48;
    ref.current.position.y = position[1] + Math.sin(t) * 0.12;
  });
  return <mesh ref={ref} position={position}><boxGeometry args={[0.9, 0.9, 0.9]} /><meshStandardMaterial color="#e5fff9" metalness={0.26} roughness={0.2} emissive="#39e4cc" emissiveIntensity={0.1} /></mesh>;
}

function RouletteRing({ position }: { position: [number, number, number] }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (ref.current) ref.current.rotation.z = clock.getElapsedTime() * -0.35;
  });
  return <mesh ref={ref} position={position} rotation={[0.22, 0, 0]}><torusGeometry args={[0.8, 0.18, 12, 36]} /><meshStandardMaterial color="#f1bd62" metalness={0.92} roughness={0.17} emissive="#a66a19" emissiveIntensity={0.24} /></mesh>;
}

function Star({ index }: { index: number }) {
  const ref = useRef<THREE.Mesh>(null);
  const angle = (index / 18) * Math.PI * 2;
  const radius = 2.5 + (index % 4) * 0.85;
  const position: [number, number, number] = [Math.cos(angle) * radius, -0.6 + (index % 5) * 0.72, Math.sin(angle) * 1.3 - 1.5];
  useFrame(({ clock }) => {
    if (ref.current) ref.current.material && ((ref.current.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.4 + Math.sin(clock.getElapsedTime() * 2 + index) * 0.28);
  });
  return <mesh ref={ref} position={position}><sphereGeometry args={[0.038 + (index % 3) * 0.015, 10, 10]} /><meshStandardMaterial color={index % 2 ? "#d9b5ff" : "#a7fff5"} emissive={index % 2 ? "#8c55ff" : "#2af6e3"} emissiveIntensity={0.6} /></mesh>;
}

export function LobbyScene() {
  const [webGL, setWebGL] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    setWebGL(supportsWebGL());
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  if (!webGL || reducedMotion) return <div className="lobby-scene fallback-scene" aria-hidden="true"><i /><i /><i /><span className="fallback-card">♠</span><span className="fallback-chip">✦</span></div>;
  return <div className="lobby-scene" aria-hidden="true"><Canvas camera={{ position: [0, 0, 8], fov: 48 }} dpr={[1, 1.6]} gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}><Scene /></Canvas></div>;
}
