// Licensed under the Apache License, Version 2.0
"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Sparkles } from "@react-three/drei";
import { useMemo, useRef, useState } from "react";
import { Group, MathUtils, Mesh } from "three";
import { type AvatarConfig } from "./AvatarScene";
import { PostEffects } from "./PostEffects";

interface SimulationSceneProps {
  sport: string;
  config: AvatarConfig;
  archetypeColor: string;
  running: boolean;
  onComplete?: () => void;
}

// ----- Sprint / Wheelchair Sprint -----

function SprintAvatar({
  config,
  color,
  running,
  isWheelchair,
}: {
  config: AvatarConfig;
  color: string;
  running: boolean;
  isWheelchair: boolean;
}) {
  const groupRef = useRef<Group>(null);
  const leftLegRef = useRef<Group>(null);
  const rightLegRef = useRef<Group>(null);
  const leftArmRef = useRef<Group>(null);
  const rightArmRef = useRef<Group>(null);
  const wheelLeftRef = useRef<Mesh>(null);
  const wheelRightRef = useRef<Mesh>(null);
  const tickRef = useRef(0);

  useFrame((_, delta) => {
    if (!running) return;
    tickRef.current += delta;
    if (groupRef.current) {
      groupRef.current.position.x += delta * 4;
    }
    if (!isWheelchair) {
      const phase = Math.sin(tickRef.current * 8);
      const phaseInv = -phase;
      if (leftLegRef.current) leftLegRef.current.rotation.x = phase * 0.5;
      if (rightLegRef.current) rightLegRef.current.rotation.x = phaseInv * 0.5;
      if (leftArmRef.current) leftArmRef.current.rotation.x = phaseInv * 0.4;
      if (rightArmRef.current) rightArmRef.current.rotation.x = phase * 0.4;
      if (groupRef.current) {
        groupRef.current.position.y = Math.abs(phase) * 0.05;
      }
    } else {
      const spin = tickRef.current * 12;
      if (wheelLeftRef.current) wheelLeftRef.current.rotation.x = spin;
      if (wheelRightRef.current) wheelRightRef.current.rotation.x = spin;
    }
  });

  const matProps = {
    color,
    emissive: color,
    emissiveIntensity: 0.4,
    metalness: 0.3,
    roughness: 0.4,
  };

  return (
    <group ref={groupRef} position={[-3, 0, 0]}>
      {/* Head */}
      <mesh position={[0, 1.7, 0]}>
        <sphereGeometry args={[0.16, 16, 16]} />
        <meshStandardMaterial {...matProps} />
      </mesh>
      {/* Torso */}
      <mesh position={[0, 1.2, 0]}>
        <cylinderGeometry args={[0.18, 0.22, 0.55, 14]} />
        <meshStandardMaterial {...matProps} />
      </mesh>
      {/* Arms */}
      <group ref={leftArmRef} position={[-0.28, 1.4, 0]}>
        <mesh position={[0, -0.3, 0]}>
          <cylinderGeometry args={[0.05, 0.05, 0.55, 10]} />
          <meshStandardMaterial {...matProps} />
        </mesh>
      </group>
      <group ref={rightArmRef} position={[0.28, 1.4, 0]}>
        <mesh position={[0, -0.3, 0]}>
          <cylinderGeometry args={[0.05, 0.05, 0.55, 10]} />
          <meshStandardMaterial {...matProps} />
        </mesh>
      </group>
      {/* Legs */}
      {!isWheelchair && (
        <>
          <group ref={leftLegRef} position={[-0.1, 0.85, 0]}>
            <mesh position={[0, -0.45, 0]}>
              <cylinderGeometry args={[0.07, 0.06, 0.85, 12]} />
              <meshStandardMaterial {...matProps} />
            </mesh>
          </group>
          <group ref={rightLegRef} position={[0.1, 0.85, 0]}>
            <mesh position={[0, -0.45, 0]}>
              <cylinderGeometry args={[0.07, 0.06, 0.85, 12]} />
              <meshStandardMaterial {...matProps} />
            </mesh>
          </group>
        </>
      )}
      {/* Wheelchair */}
      {isWheelchair && (
        <group position={[0, 0.6, 0]}>
          <mesh ref={wheelLeftRef} position={[-0.4, -0.3, 0.2]} rotation={[0, 0, 0]}>
            <torusGeometry args={[0.35, 0.04, 8, 24]} />
            <meshStandardMaterial color="#555" metalness={0.8} roughness={0.2} />
          </mesh>
          <mesh ref={wheelRightRef} position={[0.4, -0.3, 0.2]} rotation={[0, 0, 0]}>
            <torusGeometry args={[0.35, 0.04, 8, 24]} />
            <meshStandardMaterial color="#555" metalness={0.8} roughness={0.2} />
          </mesh>
          <mesh position={[0, 0.2, 0.2]}>
            <boxGeometry args={[0.6, 0.1, 0.5]} />
            <meshStandardMaterial color="#333" />
          </mesh>
        </group>
      )}
    </group>
  );
}

function Track({ length = 30 }: { length?: number }) {
  return (
    <group>
      <mesh position={[length / 2 - 4, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[length, 6]} />
        <meshStandardMaterial color="#992200" />
      </mesh>
      {[-1.5, -0.5, 0.5, 1.5].map((z) => (
        <mesh key={z} position={[length / 2 - 4, 0.01, z]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[length, 0.05]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
      ))}
      {/* Finish line */}
      <mesh position={[length - 5, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.3, 6]} />
        <meshStandardMaterial color="#f59e0b" emissive="#f59e0b" emissiveIntensity={1} />
      </mesh>
    </group>
  );
}

// ----- Shot Put -----

function ShotPutScene({
  config,
  color,
  running,
}: {
  config: AvatarConfig;
  color: string;
  running: boolean;
}) {
  const torsoRef = useRef<Group>(null);
  const ballRef = useRef<Mesh>(null);
  const tickRef = useRef(0);
  const [released, setReleased] = useState(false);
  const ballState = useRef({ x: 0, y: 1.7, vx: 0, vy: 0, released: false });

  useFrame((_, delta) => {
    if (!running) {
      tickRef.current = 0;
      ballState.current = { x: 0, y: 1.7, vx: 0, vy: 0, released: false };
      if (ballRef.current) {
        ballRef.current.position.set(0, 1.7, 0);
      }
      return;
    }
    tickRef.current += delta;
    if (torsoRef.current && tickRef.current < 0.7) {
      torsoRef.current.rotation.y = MathUtils.lerp(0, -0.9, tickRef.current / 0.7);
    } else if (torsoRef.current && tickRef.current < 1.2) {
      torsoRef.current.rotation.y = MathUtils.lerp(-0.9, 0.4, (tickRef.current - 0.7) / 0.5);
      if (!ballState.current.released && tickRef.current > 1.05) {
        ballState.current.released = true;
        ballState.current.vx = 8;
        ballState.current.vy = 5;
        setReleased(true);
      }
    }
    if (ballState.current.released && ballRef.current) {
      ballState.current.x += ballState.current.vx * delta;
      ballState.current.y += ballState.current.vy * delta;
      ballState.current.vy -= 9.8 * delta;
      ballRef.current.position.set(ballState.current.x, Math.max(0.1, ballState.current.y), 0);
    }
  });

  const matProps = {
    color,
    emissive: color,
    emissiveIntensity: 0.4,
    metalness: 0.3,
    roughness: 0.4,
  };

  return (
    <group>
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[2, 32]} />
        <meshStandardMaterial color="#222" />
      </mesh>
      <group ref={torsoRef} position={[0, 0, 0]}>
        <mesh position={[0, 1.7, 0]}>
          <sphereGeometry args={[0.16, 16, 16]} />
          <meshStandardMaterial {...matProps} />
        </mesh>
        <mesh position={[0, 1.2, 0]}>
          <cylinderGeometry args={[0.2, 0.24, 0.55, 14]} />
          <meshStandardMaterial {...matProps} />
        </mesh>
        <mesh position={[-0.1, 0.4, 0]}>
          <cylinderGeometry args={[0.07, 0.06, 0.85, 12]} />
          <meshStandardMaterial {...matProps} />
        </mesh>
        <mesh position={[0.1, 0.4, 0]}>
          <cylinderGeometry args={[0.07, 0.06, 0.85, 12]} />
          <meshStandardMaterial {...matProps} />
        </mesh>
      </group>
      <mesh ref={ballRef} position={[0, 1.7, 0]}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial color="#888" metalness={0.9} roughness={0.2} />
      </mesh>
      {released && (
        <Sparkles count={30} scale={[1.5, 0.3, 0.3]} position={[3, 0.1, 0]} size={3} speed={0.4} color={color} />
      )}
    </group>
  );
}

export function SimulationScene({
  sport,
  config,
  archetypeColor,
  running,
  onComplete,
}: SimulationSceneProps) {
  const isSprint = useMemo(
    () => /sprint|100m|200m|400m|race|wheelchair racing/i.test(sport),
    [sport]
  );
  const isShotPut = useMemo(() => /shot put|powerlifting|throw|discus/i.test(sport), [sport]);
  const isWheelchairSport = useMemo(
    () => /wheelchair|t5[0-4]|h-class|handcycle/i.test(sport),
    [sport]
  );

  return (
    <Canvas
      camera={{ position: [0, 2, 6], fov: 55 }}
      dpr={[1, 2]}
      gl={{ antialias: true }}
      style={{ background: "#0B0B0F" }}
    >
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 10, 5]} intensity={1.2} />
      <pointLight position={[0, 5, -5]} intensity={0.8} color={archetypeColor} />
      {isSprint || (!isShotPut && !isSprint) ? (
        <>
          <Track length={30} />
          <SprintAvatar
            config={config}
            color={archetypeColor}
            running={running}
            isWheelchair={isWheelchairSport || config.paralympic?.type === "wheelchair" || config.paralympic?.type === "limb_lower"}
          />
        </>
      ) : null}
      {isShotPut && (
        <ShotPutScene config={config} color={archetypeColor} running={running} />
      )}
      <PostEffects bloomStrength={0.6} vignette />
    </Canvas>
  );
}
