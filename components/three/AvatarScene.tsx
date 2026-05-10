// Licensed under the Apache License, Version 2.0
"use client";

import { useFrame } from "@react-three/fiber";
import { Sparkles } from "@react-three/drei";
import { useMemo, useRef } from "react";
import { Group, MathUtils } from "three";

export interface AvatarConfig {
  height_cm?: number;
  weight_kg?: number;
  arm_span_cm?: number;
  build?: "lean" | "athletic" | "stocky" | "tall_lean" | "broad_powerful";
  paralympic?: {
    type: "limb_lower" | "limb_upper" | "wheelchair" | "vision" | "none";
    affectedSide?: "left" | "right" | "both";
  };
}

interface AvatarSceneProps {
  config: AvatarConfig;
  color?: string;
  emissive?: number;
  rotate?: boolean;
  ignite?: boolean;
}

export function AvatarScene({
  config,
  color = "#1a1a2e",
  emissive = 0,
  rotate = true,
  ignite = false,
}: AvatarSceneProps) {
  const groupRef = useRef<Group>(null);
  const emissiveAnimRef = useRef(0);

  const proportions = useMemo(() => {
    const height = config.height_cm ?? 178;
    const weight = config.weight_kg ?? 75;
    const armSpan = config.arm_span_cm ?? height;

    const heightScale = height / 178;
    const widthScale = MathUtils.clamp(weight / 75, 0.7, 1.6);
    const armScale = armSpan / 178;

    const buildBoost: Record<NonNullable<AvatarConfig["build"]>, number> = {
      lean: 0.85,
      athletic: 1,
      stocky: 1.3,
      tall_lean: 0.85,
      broad_powerful: 1.4,
    };
    const wMul = config.build ? buildBoost[config.build] : 1;

    return {
      heightScale,
      widthScale: widthScale * wMul,
      armScale,
    };
  }, [config.height_cm, config.weight_kg, config.arm_span_cm, config.build]);

  useFrame((_, delta) => {
    if (groupRef.current && rotate) {
      groupRef.current.rotation.y += delta * 0.5;
    }
    if (ignite) {
      emissiveAnimRef.current = MathUtils.lerp(emissiveAnimRef.current, 1, 0.05);
    } else {
      emissiveAnimRef.current = MathUtils.lerp(emissiveAnimRef.current, 0, 0.05);
    }
  });

  const isWheelchair =
    config.paralympic?.type === "wheelchair" ||
    config.paralympic?.type === "limb_lower";
  const showProsthetic = config.paralympic?.type === "limb_lower";

  const torsoH = 1.0 * proportions.heightScale;
  const legH = 0.9 * proportions.heightScale;
  const armUpperH = 0.6 * proportions.armScale;
  const armForeH = 0.56 * proportions.armScale;
  const torsoR = 0.22 * proportions.widthScale;

  const baseEmissiveIntensity = ignite ? emissive + emissiveAnimRef.current * 1.5 : emissive;
  const matProps = {
    color,
    emissive: ignite ? color : "#000000",
    emissiveIntensity: baseEmissiveIntensity,
    metalness: 0.3,
    roughness: 0.4,
  };

  return (
    <group ref={groupRef} position={[0, isWheelchair ? -0.3 : -0.6, 0]}>
      {/* Head */}
      <mesh position={[0, torsoH + 0.4, 0]}>
        <sphereGeometry args={[0.18, 24, 24]} />
        <meshStandardMaterial {...matProps} />
      </mesh>
      {/* Torso */}
      <mesh position={[0, torsoH * 0.5 + 0.2, 0]}>
        <cylinderGeometry args={[torsoR * 0.85, torsoR, torsoH, 16]} />
        <meshStandardMaterial {...matProps} />
      </mesh>
      {/* Upper arms */}
      <mesh
        position={[-(torsoR + 0.07), torsoH * 0.65 + 0.2, 0]}
        rotation={[0, 0, 0.2]}
      >
        <cylinderGeometry args={[0.06, 0.06, armUpperH, 12]} />
        <meshStandardMaterial {...matProps} />
      </mesh>
      <mesh
        position={[torsoR + 0.07, torsoH * 0.65 + 0.2, 0]}
        rotation={[0, 0, -0.2]}
      >
        <cylinderGeometry args={[0.06, 0.06, armUpperH, 12]} />
        <meshStandardMaterial {...matProps} />
      </mesh>
      {/* Forearms */}
      <mesh
        position={[-(torsoR + 0.16), torsoH * 0.65 + 0.2 - armUpperH * 0.7, 0]}
        rotation={[0, 0, 0.1]}
      >
        <cylinderGeometry args={[0.05, 0.05, armForeH, 12]} />
        <meshStandardMaterial {...matProps} />
      </mesh>
      <mesh
        position={[torsoR + 0.16, torsoH * 0.65 + 0.2 - armUpperH * 0.7, 0]}
        rotation={[0, 0, -0.1]}
      >
        <cylinderGeometry args={[0.05, 0.05, armForeH, 12]} />
        <meshStandardMaterial {...matProps} />
      </mesh>

      {/* Legs */}
      {!isWheelchair && (
        <>
          <mesh position={[-0.1, -legH * 0.5 - 0.25, 0]}>
            <cylinderGeometry args={[0.07, 0.06, legH, 12]} />
            <meshStandardMaterial {...matProps} />
          </mesh>
          {showProsthetic ? (
            <mesh position={[0.1, -legH * 0.5 - 0.25, 0]} rotation={[0.2, 0, 0]}>
              <coneGeometry args={[0.08, legH, 4]} />
              <meshStandardMaterial color="#888" emissive={color} emissiveIntensity={baseEmissiveIntensity * 0.5} metalness={0.9} roughness={0.2} />
            </mesh>
          ) : (
            <mesh position={[0.1, -legH * 0.5 - 0.25, 0]}>
              <cylinderGeometry args={[0.07, 0.06, legH, 12]} />
              <meshStandardMaterial {...matProps} />
            </mesh>
          )}
        </>
      )}

      {/* Wheelchair */}
      {isWheelchair && (
        <group position={[0, -0.3, 0]}>
          <mesh position={[-0.4, -0.3, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.35, 0.04, 8, 24]} />
            <meshStandardMaterial color="#555" emissive={color} emissiveIntensity={baseEmissiveIntensity * 0.4} metalness={0.7} roughness={0.3} />
          </mesh>
          <mesh position={[0.4, -0.3, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.35, 0.04, 8, 24]} />
            <meshStandardMaterial color="#555" emissive={color} emissiveIntensity={baseEmissiveIntensity * 0.4} metalness={0.7} roughness={0.3} />
          </mesh>
          <mesh position={[0, -0.05, 0]}>
            <boxGeometry args={[0.7, 0.08, 0.5]} />
            <meshStandardMaterial color="#333" emissive={color} emissiveIntensity={baseEmissiveIntensity * 0.3} />
          </mesh>
        </group>
      )}

      {ignite && (
        <Sparkles
          count={60}
          scale={[3, 4, 3]}
          size={4}
          speed={0.4}
          color={color}
        />
      )}
    </group>
  );
}
