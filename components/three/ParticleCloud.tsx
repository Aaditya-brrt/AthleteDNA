// Licensed under the Apache License, Version 2.0
"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { BufferGeometry, BufferAttribute, Points } from "three";

const COLORS = [
  [0.94, 0.27, 0.27], // red
  [1, 1, 1],          // white
  [0.23, 0.51, 0.96], // blue
  [0.96, 0.62, 0.04], // gold
];

interface ParticleCloudProps {
  count?: number;
  active?: boolean;
  spreadRadius?: number;
}

export function ParticleCloud({
  count = 2000,
  active = true,
  spreadRadius = 6,
}: ParticleCloudProps) {
  const pointsRef = useRef<Points>(null);

  const { geometry, originalPositions } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const original = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = spreadRadius * (0.6 + Math.random() * 0.8);
      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
      original[i * 3] = x;
      original[i * 3 + 1] = y;
      original[i * 3 + 2] = z;

      const col = COLORS[Math.floor(Math.random() * COLORS.length)];
      colors[i * 3] = col[0];
      colors[i * 3 + 1] = col[1];
      colors[i * 3 + 2] = col[2];
    }
    const g = new BufferGeometry();
    g.setAttribute("position", new BufferAttribute(positions, 3));
    g.setAttribute("color", new BufferAttribute(colors, 3));
    return { geometry: g, originalPositions: original };
  }, [count, spreadRadius]);

  useFrame(() => {
    if (!pointsRef.current || !active) return;
    const positionAttr = pointsRef.current.geometry.getAttribute("position") as BufferAttribute;
    const arr = positionAttr.array as Float32Array;
    for (let i = 0; i < arr.length; i += 3) {
      arr[i] += (0 - arr[i]) * 0.05;
      arr[i + 1] += (0 - arr[i + 1]) * 0.05;
      arr[i + 2] += (0 - arr[i + 2]) * 0.05;
    }
    positionAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <primitive object={geometry} attach="geometry" />
      <pointsMaterial
        size={0.05}
        vertexColors
        transparent
        opacity={0.9}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}
