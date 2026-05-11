// Licensed under the Apache License, Version 2.0
"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useRef, useMemo } from "react";
import { CatmullRomCurve3, Group, Vector3 } from "three";

const NODE_COUNT = 80;
const HELIX_RADIUS = 1.3;
const HELIX_HEIGHT = 9;
const HELIX_TURNS = 3.2;
const STRAND_THICKNESS = 0.05;
const RUNG_THICKNESS = 0.022;

function HelixGroup() {
  const groupRef = useRef<Group>(null);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.18;
    }
  });

  const { curveA, curveB, rungs, nodesA, nodesB } = useMemo(() => {
    const nodesA: Vector3[] = [];
    const nodesB: Vector3[] = [];
    const rungs: { from: Vector3; to: Vector3 }[] = [];

    for (let i = 0; i < NODE_COUNT; i++) {
      const t = i / (NODE_COUNT - 1);
      const angle = t * HELIX_TURNS * Math.PI * 2;
      const y = (t - 0.5) * HELIX_HEIGHT;

      const a = new Vector3(
        Math.cos(angle) * HELIX_RADIUS,
        y,
        Math.sin(angle) * HELIX_RADIUS
      );
      const b = new Vector3(
        Math.cos(angle + Math.PI) * HELIX_RADIUS,
        y,
        Math.sin(angle + Math.PI) * HELIX_RADIUS
      );
      nodesA.push(a);
      nodesB.push(b);
      rungs.push({ from: a, to: b });
    }
    const curveA = new CatmullRomCurve3(nodesA, false, "catmullrom", 0.5);
    const curveB = new CatmullRomCurve3(nodesB, false, "catmullrom", 0.5);
    return { curveA, curveB, rungs, nodesA, nodesB };
  }, []);

  return (
    <group ref={groupRef}>
      {/* Strand A — continuous tube */}
      <mesh>
        <tubeGeometry args={[curveA, 400, STRAND_THICKNESS, 12, false]} />
        <meshStandardMaterial color="#A1A1AA" roughness={0.65} metalness={0.1} />
      </mesh>
      {/* Strand B — slightly lighter for separation */}
      <mesh>
        <tubeGeometry args={[curveB, 400, STRAND_THICKNESS, 12, false]} />
        <meshStandardMaterial color="#C9C5BD" roughness={0.65} metalness={0.1} />
      </mesh>

      {/* Rungs — every node */}
      {rungs.map((r, i) => {
        const dx = r.to.x - r.from.x;
        const dz = r.to.z - r.from.z;
        const len = Math.sqrt(dx * dx + dz * dz);
        const cx = (r.from.x + r.to.x) / 2;
        const cy = (r.from.y + r.to.y) / 2;
        const cz = (r.from.z + r.to.z) / 2;
        const angle = Math.atan2(dz, dx);
        return (
          <mesh
            key={`r-${i}`}
            position={[cx, cy, cz]}
            rotation={[0, -angle, Math.PI / 2]}
          >
            <cylinderGeometry args={[RUNG_THICKNESS, RUNG_THICKNESS, len, 8]} />
            <meshStandardMaterial color="#D4D4D8" roughness={0.7} metalness={0.05} />
          </mesh>
        );
      })}

      {/* Subtle joint markers at each node */}
      {nodesA.map((p, i) => (
        <mesh key={`na-${i}`} position={p}>
          <sphereGeometry args={[STRAND_THICKNESS * 1.4, 10, 10]} />
          <meshStandardMaterial color="#A1A1AA" roughness={0.6} metalness={0.15} />
        </mesh>
      ))}
      {nodesB.map((p, i) => (
        <mesh key={`nb-${i}`} position={p}>
          <sphereGeometry args={[STRAND_THICKNESS * 1.4, 10, 10]} />
          <meshStandardMaterial color="#C9C5BD" roughness={0.6} metalness={0.15} />
        </mesh>
      ))}
    </group>
  );
}

export function DNAHelix() {
  return (
    <Canvas
      camera={{ position: [0, 0, 6.2], fov: 45 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
      style={{ background: "transparent" }}
    >
      <ambientLight intensity={0.7} />
      <directionalLight position={[4, 6, 5]} intensity={0.9} />
      <directionalLight position={[-4, -3, 2]} intensity={0.35} />
      <HelixGroup />
    </Canvas>
  );
}

export default DNAHelix;
