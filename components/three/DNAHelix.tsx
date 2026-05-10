// Licensed under the Apache License, Version 2.0
"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import { useRef, useMemo } from "react";
import { Group } from "three";
import { PostEffects } from "./PostEffects";

const NODE_COUNT = 40;
const HELIX_RADIUS = 1.2;
const HELIX_HEIGHT = 8;
const HELIX_TURNS = 3;

function HelixGroup() {
  const groupRef = useRef<Group>(null);

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.003;
    }
  });

  const { strandA, strandB, rungs } = useMemo(() => {
    const strandA: [number, number, number][] = [];
    const strandB: [number, number, number][] = [];
    const rungs: { from: [number, number, number]; to: [number, number, number] }[] = [];

    for (let i = 0; i < NODE_COUNT; i++) {
      const t = i / (NODE_COUNT - 1);
      const angle = t * HELIX_TURNS * Math.PI * 2;
      const y = (t - 0.5) * HELIX_HEIGHT;

      const a: [number, number, number] = [
        Math.cos(angle) * HELIX_RADIUS,
        y,
        Math.sin(angle) * HELIX_RADIUS,
      ];
      const b: [number, number, number] = [
        Math.cos(angle + Math.PI) * HELIX_RADIUS,
        y,
        Math.sin(angle + Math.PI) * HELIX_RADIUS,
      ];
      strandA.push(a);
      strandB.push(b);
      if (i % 2 === 0) rungs.push({ from: a, to: b });
    }
    return { strandA, strandB, rungs };
  }, []);

  return (
    <group ref={groupRef}>
      {strandA.map((p, i) => (
        <mesh key={`a-${i}`} position={p}>
          <sphereGeometry args={[0.08, 12, 12]} />
          <meshStandardMaterial
            color="#3b82f6"
            emissive="#3b82f6"
            emissiveIntensity={0.7}
          />
        </mesh>
      ))}
      {strandB.map((p, i) => (
        <mesh key={`b-${i}`} position={p}>
          <sphereGeometry args={[0.08, 12, 12]} />
          <meshStandardMaterial
            color="#f59e0b"
            emissive="#f59e0b"
            emissiveIntensity={0.7}
          />
        </mesh>
      ))}
      {rungs.map((r, i) => {
        const dx = r.to[0] - r.from[0];
        const dz = r.to[2] - r.from[2];
        const len = Math.sqrt(dx * dx + dz * dz);
        const cx = (r.from[0] + r.to[0]) / 2;
        const cy = (r.from[1] + r.to[1]) / 2;
        const cz = (r.from[2] + r.to[2]) / 2;
        const angle = Math.atan2(dz, dx);
        return (
          <mesh
            key={`r-${i}`}
            position={[cx, cy, cz]}
            rotation={[0, -angle, Math.PI / 2]}
          >
            <cylinderGeometry args={[0.02, 0.02, len, 8]} />
            <meshStandardMaterial
              color="#ffffff"
              transparent
              opacity={0.3}
              emissive="#ffffff"
              emissiveIntensity={0.2}
            />
          </mesh>
        );
      })}
    </group>
  );
}

export function DNAHelix() {
  return (
    <Canvas
      camera={{ position: [0, 0, 6], fov: 50 }}
      dpr={[1, 2]}
      gl={{ antialias: true }}
      style={{ background: "#0B0B0F" }}
    >
      <ambientLight intensity={0.5} />
      <pointLight position={[5, 5, 5]} intensity={1.2} color="#3b82f6" />
      <pointLight position={[-5, -5, 3]} intensity={0.8} color="#f59e0b" />
      <Stars radius={100} depth={50} count={3000} factor={4} saturation={0} fade speed={1} />
      <HelixGroup />
      <PostEffects bloomStrength={1.2} vignette />
    </Canvas>
  );
}

export default DNAHelix;
