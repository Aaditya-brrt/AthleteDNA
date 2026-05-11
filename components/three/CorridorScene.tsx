// Licensed under the Apache License, Version 2.0
"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Text, Float, Sparkles } from "@react-three/drei";
import { Suspense, useMemo, useRef } from "react";
import { Color, DoubleSide, Group, MathUtils, Mesh, ShaderMaterial } from "three";
import { PostEffects } from "./PostEffects";
import type { Era } from "@/lib/eraWalk";
import type { Stage } from "@/lib/corridor";
import type { TwinAthlete, SportMatch, FormData, ClassificationResult } from "@/store/athleteStore";

const ROOM_SPACING = 22;
const ROOM_OFFSET = 12;
const CORRIDOR_WIDTH = 11;
const CORRIDOR_HEIGHT = 7.5;
const CAMERA_HEIGHT = 1.85;
const CAMERA_START_Z = 8;

interface CorridorSceneProps {
  stages: Stage[];
  classification: ClassificationResult;
  formData: Partial<FormData>;
  paralympicFirst: boolean;
  signatureColor: string;
  scrollProgress: number;
  activeIndex: number;
}

export function CorridorScene({
  stages,
  classification,
  formData,
  paralympicFirst,
  signatureColor,
  scrollProgress,
  activeIndex,
}: CorridorSceneProps) {
  const lastRoomZ = -ROOM_OFFSET - (stages.length - 1) * ROOM_SPACING;
  const totalLength = -lastRoomZ + ROOM_SPACING;

  return (
    <Canvas
      gl={{ antialias: true, powerPreference: "high-performance" }}
      camera={{ position: [0, CAMERA_HEIGHT, CAMERA_START_Z], fov: 60, near: 0.1, far: 280 }}
      dpr={[1, 1.6]}
    >
      <color attach="background" args={["#08080b"]} />
      <fog attach="fog" args={["#08080b", 22, 100]} />

      <Suspense fallback={null}>
        <ambientLight intensity={0.18} />
        <directionalLight position={[6, 8, 4]} intensity={0.55} color="#FDFBF7" />

        <CorridorRig
          stageCount={stages.length}
          lastRoomZ={lastRoomZ}
          scrollProgress={scrollProgress}
        />

        <Floor length={totalLength} signatureColor={signatureColor} />
        <Walls length={totalLength} signatureColor={signatureColor} />
        <Ceiling length={totalLength} />

        {stages.map((stage, i) => (
          <StageRoom
            key={i}
            stage={stage}
            index={i}
            signatureColor={signatureColor}
            isActive={i === activeIndex}
            classification={classification}
            formData={formData}
            paralympicFirst={paralympicFirst}
          />
        ))}

        <PostEffects bloomStrength={0.85} vignette chromaticAberration={false} />
      </Suspense>
    </Canvas>
  );
}

function CorridorRig({
  stageCount,
  lastRoomZ,
  scrollProgress,
}: {
  stageCount: number;
  lastRoomZ: number;
  scrollProgress: number;
}) {
  const cameraZ = useRef(CAMERA_START_Z);
  const dollyEnd = lastRoomZ - 4;

  useFrame((state, delta) => {
    const desired = MathUtils.lerp(CAMERA_START_Z, dollyEnd, scrollProgress);
    cameraZ.current = MathUtils.lerp(cameraZ.current, desired, 1 - Math.pow(0.001, delta));

    const bob = Math.sin(state.clock.elapsedTime * 1.6) * 0.02;
    const sway = Math.sin(state.clock.elapsedTime * 0.8) * 0.04;
    state.camera.position.set(sway, CAMERA_HEIGHT + bob, cameraZ.current);

    const arrivalT = (scrollProgress * (stageCount - 1)) % 1;
    const lookX = Math.sin(arrivalT * Math.PI) * -0.35;
    state.camera.lookAt(lookX, CAMERA_HEIGHT - 0.15, cameraZ.current - 12);
  });

  return <FollowLight scrollProgress={scrollProgress} dollyEnd={dollyEnd} />;
}

function FollowLight({ scrollProgress, dollyEnd }: { scrollProgress: number; dollyEnd: number }) {
  const ref = useRef<Mesh>(null);
  useFrame(() => {
    if (!ref.current) return;
    const z = MathUtils.lerp(CAMERA_START_Z, dollyEnd, scrollProgress);
    ref.current.position.z = z - 4;
  });
  return (
    <group ref={ref as unknown as React.RefObject<Group>}>
      <pointLight position={[0, 4, 0]} intensity={1.4} distance={22} color="#FDFBF7" decay={1.5} />
      <pointLight position={[0, 2, -8]} intensity={0.9} distance={18} color="#FDFBF7" decay={1.8} />
    </group>
  );
}

function Floor({ length, signatureColor }: { length: number; signatureColor: string }) {
  return (
    <group position={[0, 0, -length / 2]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[CORRIDOR_WIDTH, length + 30]} />
        <meshStandardMaterial color="#0a0a0e" roughness={0.85} metalness={0.15} />
      </mesh>
      <mesh position={[0, 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.06, length + 30]} />
        <meshBasicMaterial color={signatureColor} toneMapped={false} />
      </mesh>
      <mesh position={[-CORRIDOR_WIDTH / 2 + 0.4, 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.02, length + 30]} />
        <meshBasicMaterial color="#FDFBF7" opacity={0.18} transparent toneMapped={false} />
      </mesh>
      <mesh position={[CORRIDOR_WIDTH / 2 - 0.4, 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.02, length + 30]} />
        <meshBasicMaterial color="#FDFBF7" opacity={0.18} transparent toneMapped={false} />
      </mesh>
    </group>
  );
}

function Walls({ length, signatureColor }: { length: number; signatureColor: string }) {
  return (
    <group position={[0, CORRIDOR_HEIGHT / 2, -length / 2]}>
      <mesh position={[-CORRIDOR_WIDTH / 2, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[length + 30, CORRIDOR_HEIGHT]} />
        <meshStandardMaterial color="#0e0e12" roughness={0.92} side={DoubleSide} />
      </mesh>
      <mesh position={[CORRIDOR_WIDTH / 2, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[length + 30, CORRIDOR_HEIGHT]} />
        <meshStandardMaterial color="#0e0e12" roughness={0.92} side={DoubleSide} />
      </mesh>
      <mesh position={[-CORRIDOR_WIDTH / 2 + 0.01, CORRIDOR_HEIGHT / 2 - 0.4, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[length + 30, 0.015]} />
        <meshBasicMaterial color={signatureColor} opacity={0.6} transparent toneMapped={false} />
      </mesh>
      <mesh position={[CORRIDOR_WIDTH / 2 - 0.01, CORRIDOR_HEIGHT / 2 - 0.4, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[length + 30, 0.015]} />
        <meshBasicMaterial color={signatureColor} opacity={0.6} transparent toneMapped={false} />
      </mesh>
    </group>
  );
}

function Ceiling({ length }: { length: number }) {
  return (
    <mesh position={[0, CORRIDOR_HEIGHT, -length / 2]} rotation={[Math.PI / 2, 0, 0]}>
      <planeGeometry args={[CORRIDOR_WIDTH, length + 30]} />
      <meshStandardMaterial color="#06060a" roughness={1} />
    </mesh>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Stage dispatcher
// ───────────────────────────────────────────────────────────────────────────
function StageRoom({
  stage,
  index,
  signatureColor,
  isActive,
  classification,
  formData,
  paralympicFirst,
}: {
  stage: Stage;
  index: number;
  signatureColor: string;
  isActive: boolean;
  classification: ClassificationResult;
  formData: Partial<FormData>;
  paralympicFirst: boolean;
}) {
  const z = -ROOM_OFFSET - index * ROOM_SPACING;

  return (
    <group position={[0, 0, z]}>
      {/* Floor seam between rooms */}
      <mesh position={[0, 0.002, ROOM_SPACING / 2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[CORRIDOR_WIDTH - 1, 0.04]} />
        <meshBasicMaterial color={signatureColor} opacity={0.4} transparent toneMapped={false} />
      </mesh>

      {/* Stage stamp on the floor */}
      <Text
        position={[0, 0.005, ROOM_SPACING / 2 - 0.7]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.18}
        color="#FDFBF7"
        anchorX="center"
        anchorY="middle"
        material-toneMapped={false}
        material-opacity={0.5}
        material-transparent
        letterSpacing={0.2}
      >
        {`STAGE ${String(index + 1).padStart(2, "0")} · ${stageLabel(stage)}`}
      </Text>

      {isActive && (
        <Sparkles count={28} scale={[7, 4, 7]} size={2} speed={0.35} color={signatureColor} position={[0, 2.6, 0]} />
      )}

      {stage.kind === "threshold" && (
        <ThresholdRoom
          classification={classification}
          formData={formData}
          signatureColor={signatureColor}
          isActive={isActive}
        />
      )}
      {stage.kind === "era" && (
        <EraRoom era={stage.era} eraNumber={stage.eraNumber} signatureColor={signatureColor} isActive={isActive} />
      )}
      {stage.kind === "twins_hall" && (
        <TwinsHallRoom
          olympic={stage.olympic}
          paralympic={stage.paralympic}
          paralympicFirst={paralympicFirst}
          signatureColor={signatureColor}
          isActive={isActive}
        />
      )}
      {stage.kind === "pathway" && (
        <PathwayRoom
          olympic={stage.olympic}
          paralympic={stage.paralympic}
          paralympicFirst={paralympicFirst}
          signatureColor={signatureColor}
          isActive={isActive}
        />
      )}
      {stage.kind === "mirror_exit" && (
        <MirrorExitRoom
          classification={classification}
          formData={formData}
          signatureColor={signatureColor}
          isActive={isActive}
        />
      )}
    </group>
  );
}

function stageLabel(stage: Stage): string {
  if (stage.kind === "threshold") return "THRESHOLD";
  if (stage.kind === "era") return stage.era.pathway === "olympic" ? "OLYMPIC ERA" : "PARALYMPIC ERA";
  if (stage.kind === "twins_hall") return "TWINS HALL";
  if (stage.kind === "pathway") return "PATHWAY ROOM";
  return "DOSSIER · EXIT";
}

// ───────────────────────────────────────────────────────────────────────────
// Threshold room — archetype name + stats + avatar
// ───────────────────────────────────────────────────────────────────────────
function ThresholdRoom({
  classification,
  formData,
  signatureColor,
  isActive,
}: {
  classification: ClassificationResult;
  formData: Partial<FormData>;
  signatureColor: string;
  isActive: boolean;
}) {
  // Archetype name on left wall
  return (
    <group>
      <ArchetypePanel name={classification.archetype} signatureColor={signatureColor} isActive={isActive} />
      <StatsWall stats={classification.stats} signatureColor={signatureColor} isActive={isActive} />
      <ProceduralAvatar
        config={formData}
        signatureColor={signatureColor}
        isActive={isActive}
        position={[0, 0, 1.5]}
      />
      <Text
        position={[0, 4.6, -8]}
        fontSize={0.4}
        color="#FDFBF7"
        anchorX="center"
        anchorY="middle"
        material-toneMapped={false}
        material-opacity={0.7}
        material-transparent
        letterSpacing={0.4}
      >
        BEGIN THE WALK
      </Text>
    </group>
  );
}

function ArchetypePanel({ name, signatureColor, isActive }: { name: string; signatureColor: string; isActive: boolean }) {
  const matRef = useRef<ShaderMaterial>(null);
  const intensity = useRef(isActive ? 1 : 0.4);
  const uniforms = useMemo(
    () => ({
      uColor: { value: new Color(signatureColor) },
      uIntensity: { value: 0.4 },
      uTime: { value: 0 },
    }),
    [signatureColor]
  );
  useFrame((_, delta) => {
    intensity.current = MathUtils.lerp(intensity.current, isActive ? 1 : 0.4, 1 - Math.pow(0.05, delta));
    if (matRef.current) {
      matRef.current.uniforms.uIntensity.value = intensity.current;
      matRef.current.uniforms.uTime.value += delta;
    }
  });

  return (
    <group position={[-CORRIDOR_WIDTH / 2 + 0.05, CORRIDOR_HEIGHT / 2 - 0.3, -3]} rotation={[0, Math.PI / 2, 0]}>
      <mesh>
        <planeGeometry args={[10, 5.6]} />
        <shaderMaterial
          ref={matRef}
          uniforms={uniforms}
          transparent
          toneMapped={false}
          vertexShader={MURAL_VERT}
          fragmentShader={MURAL_FRAG}
        />
      </mesh>
      <Text
        position={[-4.6, 1.8, 0.02]}
        fontSize={0.32}
        color="#FDFBF7"
        anchorX="left"
        anchorY="middle"
        maxWidth={9}
        material-toneMapped={false}
        letterSpacing={0.3}
      >
        ATHLETE DNA · ARCHETYPE
      </Text>
      <Text
        position={[-4.6, 0.4, 0.02]}
        fontSize={0.95}
        color="#FDFBF7"
        anchorX="left"
        anchorY="middle"
        maxWidth={9.2}
        lineHeight={0.92}
        material-toneMapped={false}
        letterSpacing={0.01}
      >
        {name}
      </Text>
      <mesh position={[-4.6, -1.5, 0.02]}>
        <planeGeometry args={[1.2, 0.02]} />
        <meshBasicMaterial color={signatureColor} toneMapped={false} />
      </mesh>
      <Text
        position={[-4.6, -1.75, 0.02]}
        fontSize={0.18}
        color={signatureColor}
        anchorX="left"
        anchorY="middle"
        material-toneMapped={false}
        letterSpacing={0.2}
      >
        TEAM USA · 120 YEARS
      </Text>
    </group>
  );
}

function StatsWall({ stats, signatureColor, isActive }: { stats: ClassificationResult["stats"]; signatureColor: string; isActive: boolean }) {
  const groupRef = useRef<Group>(null);
  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const t = isActive ? 1 : 0.5;
    groupRef.current.scale.x = MathUtils.lerp(groupRef.current.scale.x, t, 1 - Math.pow(0.05, delta));
    groupRef.current.scale.y = groupRef.current.scale.x;
  });
  return (
    <group ref={groupRef} position={[CORRIDOR_WIDTH / 2 - 0.08, CORRIDOR_HEIGHT / 2, 0]} rotation={[0, -Math.PI / 2, 0]}>
      {(["power", "endurance", "precision"] as const).map((stat, i) => {
        const value = stats[stat];
        const yOffset = 1.5 - i * 1.2;
        return (
          <group key={stat} position={[0, yOffset, 0]}>
            <Text
              position={[-3.5, 0.3, 0.02]}
              fontSize={0.2}
              color="#FDFBF7"
              anchorX="left"
              anchorY="middle"
              material-toneMapped={false}
              material-opacity={0.7}
              material-transparent
              letterSpacing={0.3}
            >
              {stat.toUpperCase()}
            </Text>
            <Text
              position={[3.5, 0.3, 0.02]}
              fontSize={0.6}
              color={signatureColor}
              anchorX="right"
              anchorY="middle"
              material-toneMapped={false}
            >
              {`${value}/10`}
            </Text>
            {/* bar background */}
            <mesh position={[0, -0.15, 0.02]}>
              <planeGeometry args={[7, 0.04]} />
              <meshBasicMaterial color="#FDFBF7" opacity={0.2} transparent toneMapped={false} />
            </mesh>
            {/* fill */}
            <mesh position={[-3.5 + (value / 10) * 7 / 2, -0.15, 0.025]}>
              <planeGeometry args={[(value / 10) * 7, 0.06]} />
              <meshBasicMaterial color={signatureColor} toneMapped={false} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Era room (mural + ghost + year monolith) — pathway badge differentiates O/P
// ───────────────────────────────────────────────────────────────────────────
function EraRoom({
  era,
  eraNumber,
  signatureColor,
  isActive,
}: {
  era: Era;
  eraNumber: number;
  signatureColor: string;
  isActive: boolean;
}) {
  return (
    <group>
      <Mural era={era} signatureColor={signatureColor} isActive={isActive} />
      <YearMonolith era={era} signatureColor={signatureColor} isActive={isActive} />
      <ProceduralFigure
        signatureColor={era.pathway === "paralympic" ? "#FDFBF7" : signatureColor}
        accentColor={signatureColor}
        position={[2.6, 0.05, 0]}
        isActive={isActive}
        seated={era.pathway === "paralympic" && /wheelchair|seated|f4|t5/i.test(era.sport)}
      />
      <Text
        position={[-CORRIDOR_WIDTH / 2 + 0.5, 0.02, ROOM_SPACING / 2 - 1.6]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.26}
        color={signatureColor}
        anchorX="left"
        anchorY="middle"
        material-toneMapped={false}
        letterSpacing={0.18}
      >
        {`ERA ${String(eraNumber).padStart(2, "0")} · ${era.pathway === "olympic" ? "OLYMPIC" : "PARALYMPIC"}`}
      </Text>
    </group>
  );
}

function Mural({ era, signatureColor, isActive }: { era: Era; signatureColor: string; isActive: boolean }) {
  const matRef = useRef<ShaderMaterial>(null);
  const intensity = useRef(isActive ? 1 : 0.35);
  const uniforms = useMemo(
    () => ({
      uColor: { value: new Color(signatureColor) },
      uIntensity: { value: 0.35 },
      uTime: { value: 0 },
    }),
    [signatureColor]
  );
  useFrame((_, delta) => {
    intensity.current = MathUtils.lerp(intensity.current, isActive ? 1 : 0.35, 1 - Math.pow(0.05, delta));
    if (matRef.current) {
      matRef.current.uniforms.uIntensity.value = intensity.current;
      matRef.current.uniforms.uTime.value += delta;
    }
  });
  return (
    <group position={[-CORRIDOR_WIDTH / 2 + 0.05, CORRIDOR_HEIGHT / 2 - 0.3, -3]} rotation={[0, Math.PI / 2, 0]}>
      <mesh>
        <planeGeometry args={[8.5, 5]} />
        <shaderMaterial
          ref={matRef}
          uniforms={uniforms}
          transparent
          toneMapped={false}
          vertexShader={MURAL_VERT}
          fragmentShader={MURAL_FRAG}
        />
      </mesh>
      <Text
        position={[-3.9, 1.55, 0.02]}
        fontSize={0.3}
        color="#FDFBF7"
        anchorX="left"
        anchorY="middle"
        maxWidth={7.6}
        material-toneMapped={false}
        letterSpacing={0.18}
      >
        {`${era.pathway === "olympic" ? "OLYMPIC" : "PARALYMPIC"} · ${era.sport.toUpperCase()}`}
      </Text>
      <Text
        position={[-3.9, 0.55, 0.02]}
        fontSize={0.46}
        color="#FDFBF7"
        anchorX="left"
        anchorY="middle"
        maxWidth={7.6}
        lineHeight={1.1}
        material-toneMapped={false}
      >
        {era.achievement}
      </Text>
      <Text
        position={[-3.9, -0.6, 0.02]}
        fontSize={0.22}
        color="#FDFBF7"
        anchorX="left"
        anchorY="top"
        maxWidth={7.6}
        lineHeight={1.3}
        material-toneMapped={false}
        material-opacity={0.78}
        material-transparent
      >
        {era.archetype_motto}
      </Text>
      <mesh position={[-3.9, -1.65, 0.02]}>
        <planeGeometry args={[1.2, 0.02]} />
        <meshBasicMaterial color={signatureColor} toneMapped={false} />
      </mesh>
      <Text
        position={[-3.9, -1.9, 0.02]}
        fontSize={0.17}
        color={signatureColor}
        anchorX="left"
        anchorY="middle"
        material-toneMapped={false}
        letterSpacing={0.2}
      >
        {`${era.games.toUpperCase()} · ${era.city.toUpperCase()}`}
      </Text>
    </group>
  );
}

function YearMonolith({ era, signatureColor, isActive }: { era: Era; signatureColor: string; isActive: boolean }) {
  const groupRef = useRef<Group>(null);
  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const target = isActive ? 1 : 0.4;
    groupRef.current.scale.x = MathUtils.lerp(groupRef.current.scale.x, target, 1 - Math.pow(0.04, delta));
    groupRef.current.scale.y = groupRef.current.scale.x;
    groupRef.current.position.y = 1.45 + Math.sin(state.clock.elapsedTime * 0.6) * 0.03;
  });
  return (
    <group ref={groupRef} position={[CORRIDOR_WIDTH / 2 - 0.6, 1.45, 0]} rotation={[0, -Math.PI / 2, 0]}>
      <Float speed={0.6} rotationIntensity={0.05} floatIntensity={0.12}>
        <Text fontSize={1.55} color={signatureColor} anchorX="center" anchorY="middle" material-toneMapped={false}>
          {String(era.year)}
        </Text>
        <Text
          position={[0, -1.0, 0]}
          fontSize={0.18}
          color="#FDFBF7"
          anchorX="center"
          anchorY="middle"
          material-toneMapped={false}
          material-opacity={0.75}
          material-transparent
          letterSpacing={0.3}
        >
          {era.decade.toUpperCase()}
        </Text>
      </Float>
    </group>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Twins Hall — 3 Olympic ghosts left wall, 3 Paralympic right wall
// ───────────────────────────────────────────────────────────────────────────
function TwinsHallRoom({
  olympic,
  paralympic,
  paralympicFirst,
  signatureColor,
  isActive,
}: {
  olympic: TwinAthlete[];
  paralympic: TwinAthlete[];
  paralympicFirst: boolean;
  signatureColor: string;
  isActive: boolean;
}) {
  const leftSet = paralympicFirst ? paralympic : olympic;
  const rightSet = paralympicFirst ? olympic : paralympic;
  return (
    <group>
      <Text
        position={[0, CORRIDOR_HEIGHT - 0.6, -3]}
        fontSize={0.45}
        color={signatureColor}
        anchorX="center"
        anchorY="middle"
        material-toneMapped={false}
        letterSpacing={0.4}
      >
        TWINS HALL
      </Text>
      <Text
        position={[0, CORRIDOR_HEIGHT - 1.2, -3]}
        fontSize={0.18}
        color="#FDFBF7"
        anchorX="center"
        anchorY="middle"
        material-toneMapped={false}
        material-opacity={0.65}
        material-transparent
        letterSpacing={0.3}
      >
        ROSTER COHORTS WITH YOUR DNA PROPORTIONS
      </Text>

      {/* LEFT wall — 3 ghosts */}
      {leftSet.slice(0, 3).map((twin, i) => {
        const z = -7.5 + i * 5.5;
        return (
          <TwinPlaque
            key={`L-${i}`}
            twin={twin}
            position={[-CORRIDOR_WIDTH / 2 + 1.8, 0.05, z]}
            facing="right"
            signatureColor={signatureColor}
            isActive={isActive}
          />
        );
      })}

      {/* RIGHT wall — 3 ghosts */}
      {rightSet.slice(0, 3).map((twin, i) => {
        const z = -5 + i * 5.5;
        return (
          <TwinPlaque
            key={`R-${i}`}
            twin={twin}
            position={[CORRIDOR_WIDTH / 2 - 1.8, 0.05, z]}
            facing="left"
            signatureColor={signatureColor}
            isActive={isActive}
          />
        );
      })}

      <Text
        position={[-CORRIDOR_WIDTH / 2 + 1.8, 3.7, -7.5]}
        fontSize={0.22}
        color="#FDFBF7"
        anchorX="center"
        anchorY="middle"
        material-toneMapped={false}
        material-opacity={0.55}
        material-transparent
        letterSpacing={0.3}
      >
        {paralympicFirst ? "PARALYMPIC COHORTS" : "OLYMPIC COHORTS"}
      </Text>
      <Text
        position={[CORRIDOR_WIDTH / 2 - 1.8, 3.7, -5]}
        fontSize={0.22}
        color="#FDFBF7"
        anchorX="center"
        anchorY="middle"
        material-toneMapped={false}
        material-opacity={0.55}
        material-transparent
        letterSpacing={0.3}
      >
        {paralympicFirst ? "OLYMPIC COHORTS" : "PARALYMPIC COHORTS"}
      </Text>
    </group>
  );
}

function TwinPlaque({
  twin,
  position,
  facing,
  signatureColor,
  isActive,
}: {
  twin: TwinAthlete;
  position: [number, number, number];
  facing: "left" | "right";
  signatureColor: string;
  isActive: boolean;
}) {
  const ref = useRef<Group>(null);
  useFrame((state, delta) => {
    if (!ref.current) return;
    ref.current.position.y = MathUtils.lerp(ref.current.position.y, isActive ? 0.05 : -0.4, 1 - Math.pow(0.05, delta));
    ref.current.rotation.y = state.clock.elapsedTime * 0.2 + position[2];
  });
  const rotY = facing === "right" ? Math.PI / 2 : -Math.PI / 2;
  return (
    <group position={position}>
      {/* Ghost figure */}
      <group ref={ref}>
        <mesh position={[0, 0.05, 0]}>
          <cylinderGeometry args={[0.65, 0.75, 0.1, 32]} />
          <meshStandardMaterial color="#0B0B0F" metalness={0.6} roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.105, 0]}>
          <cylinderGeometry args={[0.66, 0.66, 0.005, 32]} />
          <meshBasicMaterial color={signatureColor} toneMapped={false} />
        </mesh>
        {/* Body */}
        <mesh position={[0, 0.95, 0]}>
          <capsuleGeometry args={[0.2, 0.55, 6, 12]} />
          <meshStandardMaterial color={signatureColor} emissive={signatureColor} emissiveIntensity={0.5} transparent opacity={0.55} />
        </mesh>
        <mesh position={[0, 1.5, 0]}>
          <sphereGeometry args={[0.16, 14, 14]} />
          <meshStandardMaterial color={signatureColor} emissive={signatureColor} emissiveIntensity={0.6} transparent opacity={0.55} />
        </mesh>
      </group>
      {/* Floating plaque facing the corridor */}
      <group position={[0, 2.25, 0]} rotation={[0, rotY, 0]}>
        <Text
          position={[0, 0.45, 0]}
          fontSize={0.15}
          color={signatureColor}
          anchorX="center"
          anchorY="middle"
          material-toneMapped={false}
          letterSpacing={0.25}
        >
          {`${twin.year} · ${twin.pathway === "olympic" ? "OLYMPIC" : "PARALYMPIC"}`}
        </Text>
        <Text
          position={[0, 0.1, 0]}
          fontSize={0.24}
          color="#FDFBF7"
          anchorX="center"
          anchorY="middle"
          maxWidth={3.5}
          lineHeight={1.05}
          material-toneMapped={false}
          letterSpacing={0.08}
        >
          {twin.code}
        </Text>
        <Text
          position={[0, -0.3, 0]}
          fontSize={0.13}
          color="#FDFBF7"
          anchorX="center"
          anchorY="middle"
          material-toneMapped={false}
          material-opacity={0.7}
          material-transparent
          maxWidth={3.5}
        >
          {`${twin.sport.toUpperCase()} · ${twin.similarity_percent}% MATCH`}
        </Text>
      </group>
    </group>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Pathway Room — sport panels, equal sides
// ───────────────────────────────────────────────────────────────────────────
function PathwayRoom({
  olympic,
  paralympic,
  paralympicFirst,
  signatureColor,
  isActive,
}: {
  olympic: SportMatch[];
  paralympic: SportMatch[];
  paralympicFirst: boolean;
  signatureColor: string;
  isActive: boolean;
}) {
  const leftSet = paralympicFirst ? paralympic : olympic;
  const rightSet = paralympicFirst ? olympic : paralympic;
  const leftLabel = paralympicFirst ? "PARALYMPIC" : "OLYMPIC";
  const rightLabel = paralympicFirst ? "OLYMPIC" : "PARALYMPIC";

  return (
    <group>
      <Text
        position={[0, CORRIDOR_HEIGHT - 0.6, -3]}
        fontSize={0.45}
        color={signatureColor}
        anchorX="center"
        anchorY="middle"
        material-toneMapped={false}
        letterSpacing={0.4}
      >
        YOUR PATHWAY
      </Text>
      <Text
        position={[0, CORRIDOR_HEIGHT - 1.2, -3]}
        fontSize={0.18}
        color="#FDFBF7"
        anchorX="center"
        anchorY="middle"
        material-toneMapped={false}
        material-opacity={0.65}
        material-transparent
        letterSpacing={0.3}
      >
        TOP THREE SPORTS · OLYMPIC AND PARALYMPIC · EQUAL DEPTH
      </Text>

      {leftSet.slice(0, 3).map((sport, i) => {
        const z = -7 + i * 5;
        return (
          <SportPanel
            key={`L-${sport.name}`}
            sport={sport}
            signatureColor={signatureColor}
            position={[-CORRIDOR_WIDTH / 2 + 0.05, CORRIDOR_HEIGHT / 2 - 0.3, z]}
            facing="right"
            pathwayLabel={leftLabel}
            isActive={isActive}
          />
        );
      })}
      {rightSet.slice(0, 3).map((sport, i) => {
        const z = -7 + i * 5;
        return (
          <SportPanel
            key={`R-${sport.name}`}
            sport={sport}
            signatureColor={signatureColor}
            position={[CORRIDOR_WIDTH / 2 - 0.05, CORRIDOR_HEIGHT / 2 - 0.3, z]}
            facing="left"
            pathwayLabel={rightLabel}
            isActive={isActive}
          />
        );
      })}
    </group>
  );
}

function SportPanel({
  sport,
  signatureColor,
  position,
  facing,
  pathwayLabel,
  isActive,
}: {
  sport: SportMatch;
  signatureColor: string;
  position: [number, number, number];
  facing: "left" | "right";
  pathwayLabel: string;
  isActive: boolean;
}) {
  const matRef = useRef<ShaderMaterial>(null);
  const intensity = useRef(isActive ? 1 : 0.35);
  const uniforms = useMemo(
    () => ({
      uColor: { value: new Color(signatureColor) },
      uIntensity: { value: 0.35 },
      uTime: { value: 0 },
    }),
    [signatureColor]
  );
  useFrame((_, delta) => {
    intensity.current = MathUtils.lerp(intensity.current, isActive ? 1 : 0.35, 1 - Math.pow(0.05, delta));
    if (matRef.current) {
      matRef.current.uniforms.uIntensity.value = intensity.current;
      matRef.current.uniforms.uTime.value += delta;
    }
  });
  const rotY = facing === "right" ? Math.PI / 2 : -Math.PI / 2;
  return (
    <group position={position} rotation={[0, rotY, 0]}>
      <mesh>
        <planeGeometry args={[4.2, 4.4]} />
        <shaderMaterial
          ref={matRef}
          uniforms={uniforms}
          transparent
          toneMapped={false}
          vertexShader={MURAL_VERT}
          fragmentShader={MURAL_FRAG}
        />
      </mesh>
      <Text
        position={[-1.85, 1.5, 0.02]}
        fontSize={0.18}
        color="#FDFBF7"
        anchorX="left"
        anchorY="middle"
        material-toneMapped={false}
        material-opacity={0.7}
        material-transparent
        letterSpacing={0.25}
      >
        {pathwayLabel}
      </Text>
      <Text
        position={[-1.85, 0.7, 0.02]}
        fontSize={0.42}
        color="#FDFBF7"
        anchorX="left"
        anchorY="middle"
        maxWidth={3.7}
        lineHeight={1}
        material-toneMapped={false}
      >
        {sport.name}
      </Text>
      <Text
        position={[-1.85, -0.6, 0.02]}
        fontSize={1.1}
        color={signatureColor}
        anchorX="left"
        anchorY="middle"
        material-toneMapped={false}
      >
        {`${sport.match_percent}`}
      </Text>
      <Text
        position={[-1.85, -1.55, 0.02]}
        fontSize={0.13}
        color="#FDFBF7"
        anchorX="left"
        anchorY="middle"
        material-toneMapped={false}
        material-opacity={0.6}
        material-transparent
        letterSpacing={0.2}
      >
        % ARCHETYPE MATCH
      </Text>
    </group>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Mirror + Exit room — reasoning + biometrics + avatar + EXIT door
// ───────────────────────────────────────────────────────────────────────────
function MirrorExitRoom({
  classification,
  formData,
  signatureColor,
  isActive,
}: {
  classification: ClassificationResult;
  formData: Partial<FormData>;
  signatureColor: string;
  isActive: boolean;
}) {
  return (
    <group>
      {/* Reasoning — left wall */}
      <group position={[-CORRIDOR_WIDTH / 2 + 0.05, CORRIDOR_HEIGHT / 2 - 0.3, -3]} rotation={[0, Math.PI / 2, 0]}>
        <Text
          position={[-3.9, 1.8, 0]}
          fontSize={0.22}
          color={signatureColor}
          anchorX="left"
          anchorY="middle"
          material-toneMapped={false}
          letterSpacing={0.3}
        >
          REASONING
        </Text>
        <mesh position={[-3.9, 1.5, 0]}>
          <planeGeometry args={[1.2, 0.02]} />
          <meshBasicMaterial color={signatureColor} toneMapped={false} />
        </mesh>
        <Text
          position={[-3.9, 0.4, 0]}
          fontSize={0.24}
          color="#FDFBF7"
          anchorX="left"
          anchorY="top"
          maxWidth={7.8}
          lineHeight={1.4}
          material-toneMapped={false}
          material-opacity={0.88}
          material-transparent
        >
          {classification.reasoning}
        </Text>
      </group>

      {/* Biometrics — right wall */}
      <group position={[CORRIDOR_WIDTH / 2 - 0.05, CORRIDOR_HEIGHT / 2 - 0.3, -3]} rotation={[0, -Math.PI / 2, 0]}>
        <Text
          position={[-3.9, 1.8, 0]}
          fontSize={0.22}
          color={signatureColor}
          anchorX="left"
          anchorY="middle"
          material-toneMapped={false}
          letterSpacing={0.3}
        >
          BIOMETRICS
        </Text>
        <mesh position={[-3.9, 1.5, 0]}>
          <planeGeometry args={[1.2, 0.02]} />
          <meshBasicMaterial color={signatureColor} toneMapped={false} />
        </mesh>
        {(
          [
            ["HEIGHT", `${formData.height_cm ?? "—"} cm`],
            ["WEIGHT", `${formData.weight_kg ?? "—"} kg`],
            ["ARM SPAN", `${formData.arm_span_cm ?? "—"} cm`],
            ["BUILD", String(formData.build ?? "—").replace("_", " ").toUpperCase()],
          ] as const
        ).map(([label, value], i) => (
          <group key={label} position={[0, 0.5 - i * 0.7, 0]}>
            <Text
              position={[-3.9, 0, 0]}
              fontSize={0.16}
              color="#FDFBF7"
              anchorX="left"
              anchorY="middle"
              material-toneMapped={false}
              material-opacity={0.65}
              material-transparent
              letterSpacing={0.25}
            >
              {label}
            </Text>
            <Text
              position={[3.9, 0, 0]}
              fontSize={0.32}
              color="#FDFBF7"
              anchorX="right"
              anchorY="middle"
              material-toneMapped={false}
            >
              {value}
            </Text>
          </group>
        ))}
      </group>

      {/* Avatar at center */}
      <ProceduralAvatar config={formData} signatureColor={signatureColor} isActive={isActive} position={[0, 0, 0]} />

      {/* Exit portal — back wall */}
      <ExitPortal signatureColor={signatureColor} isActive={isActive} />
    </group>
  );
}

function ExitPortal({ signatureColor, isActive }: { signatureColor: string; isActive: boolean }) {
  const matRef = useRef<ShaderMaterial>(null);
  const intensity = useRef(isActive ? 1 : 0.5);
  const uniforms = useMemo(
    () => ({
      uColor: { value: new Color(signatureColor) },
      uIntensity: { value: 0.5 },
      uTime: { value: 0 },
    }),
    [signatureColor]
  );
  useFrame((_, delta) => {
    intensity.current = MathUtils.lerp(intensity.current, isActive ? 1 : 0.5, 1 - Math.pow(0.05, delta));
    if (matRef.current) {
      matRef.current.uniforms.uIntensity.value = intensity.current;
      matRef.current.uniforms.uTime.value += delta;
    }
  });
  return (
    <group position={[0, CORRIDOR_HEIGHT / 2, -ROOM_SPACING / 2 + 0.5]}>
      <mesh>
        <planeGeometry args={[CORRIDOR_WIDTH - 1.5, CORRIDOR_HEIGHT - 1]} />
        <shaderMaterial
          ref={matRef}
          uniforms={uniforms}
          transparent
          toneMapped={false}
          vertexShader={MURAL_VERT}
          fragmentShader={MURAL_FRAG}
        />
      </mesh>
      <Text position={[0, 0.5, 0.02]} fontSize={0.85} color="#FDFBF7" anchorX="center" anchorY="middle" material-toneMapped={false} letterSpacing={0.05}>
        PROCEED
      </Text>
      <Text
        position={[0, -0.4, 0.02]}
        fontSize={0.4}
        color="#FDFBF7"
        anchorX="center"
        anchorY="middle"
        material-toneMapped={false}
        material-opacity={0.85}
        material-transparent
        letterSpacing={0.4}
      >
        TO YOUR DOSSIER
      </Text>
      <mesh position={[0, -1.4, 0.02]}>
        <planeGeometry args={[2, 0.02]} />
        <meshBasicMaterial color={signatureColor} toneMapped={false} />
      </mesh>
    </group>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Procedural ghost figure (two postures)
// ───────────────────────────────────────────────────────────────────────────
function ProceduralFigure({
  signatureColor,
  accentColor,
  position,
  isActive,
  seated = false,
}: {
  signatureColor: string;
  accentColor: string;
  position: [number, number, number];
  isActive: boolean;
  seated?: boolean;
}) {
  const ref = useRef<Group>(null);
  useFrame((state, delta) => {
    if (!ref.current) return;
    ref.current.position.y = MathUtils.lerp(ref.current.position.y, isActive ? 0.05 : -0.4, 1 - Math.pow(0.05, delta));
    ref.current.rotation.y = state.clock.elapsedTime * 0.18;
  });
  return (
    <group ref={ref} position={position}>
      <mesh position={[0, 0.05, 0]}>
        <cylinderGeometry args={[0.7, 0.8, 0.1, 32]} />
        <meshStandardMaterial color="#0B0B0F" metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.105, 0]}>
        <cylinderGeometry args={[0.71, 0.71, 0.005, 32]} />
        <meshBasicMaterial color={accentColor} toneMapped={false} />
      </mesh>
      {seated ? (
        // Seated wheelchair-style silhouette: torso + simplified base
        <>
          <mesh position={[0, 0.7, 0]}>
            <boxGeometry args={[0.8, 0.4, 0.6]} />
            <meshStandardMaterial color="#0B0B0F" metalness={0.4} roughness={0.6} />
          </mesh>
          <mesh position={[0, 1.15, 0]}>
            <capsuleGeometry args={[0.22, 0.5, 6, 12]} />
            <meshStandardMaterial
              color={signatureColor}
              emissive={signatureColor}
              emissiveIntensity={0.55}
              transparent
              opacity={0.6}
              roughness={0.4}
            />
          </mesh>
          <mesh position={[0, 1.7, 0]}>
            <sphereGeometry args={[0.18, 16, 16]} />
            <meshStandardMaterial
              color={signatureColor}
              emissive={signatureColor}
              emissiveIntensity={0.65}
              transparent
              opacity={0.6}
            />
          </mesh>
        </>
      ) : (
        <>
          <mesh position={[0, 0.95, 0]}>
            <capsuleGeometry args={[0.22, 0.6, 6, 12]} />
            <meshStandardMaterial
              color={signatureColor}
              emissive={signatureColor}
              emissiveIntensity={0.6}
              transparent
              opacity={0.55}
              roughness={0.4}
            />
          </mesh>
          <mesh position={[0, 1.55, 0]}>
            <sphereGeometry args={[0.18, 16, 16]} />
            <meshStandardMaterial
              color={signatureColor}
              emissive={signatureColor}
              emissiveIntensity={0.7}
              transparent
              opacity={0.55}
            />
          </mesh>
          <mesh position={[0.32, 1.05, 0]} rotation={[0, 0, -0.4]}>
            <capsuleGeometry args={[0.07, 0.5, 4, 8]} />
            <meshStandardMaterial color={signatureColor} emissive={signatureColor} emissiveIntensity={0.5} transparent opacity={0.5} />
          </mesh>
          <mesh position={[-0.32, 1.05, 0]} rotation={[0, 0, 0.4]}>
            <capsuleGeometry args={[0.07, 0.5, 4, 8]} />
            <meshStandardMaterial color={signatureColor} emissive={signatureColor} emissiveIntensity={0.5} transparent opacity={0.5} />
          </mesh>
          <mesh position={[0.12, 0.4, 0]}>
            <capsuleGeometry args={[0.09, 0.55, 4, 8]} />
            <meshStandardMaterial color={signatureColor} emissive={signatureColor} emissiveIntensity={0.5} transparent opacity={0.5} />
          </mesh>
          <mesh position={[-0.12, 0.4, 0]}>
            <capsuleGeometry args={[0.09, 0.55, 4, 8]} />
            <meshStandardMaterial color={signatureColor} emissive={signatureColor} emissiveIntensity={0.5} transparent opacity={0.5} />
          </mesh>
        </>
      )}
    </group>
  );
}

// User's procedural avatar — slightly larger, biometric-scaled, archetype-color emissive
function ProceduralAvatar({
  config,
  signatureColor,
  isActive,
  position,
}: {
  config: Partial<FormData>;
  signatureColor: string;
  isActive: boolean;
  position: [number, number, number];
}) {
  const ref = useRef<Group>(null);
  const heightScale = (config.height_cm ?? 178) / 178;
  const buildBoost: Record<string, number> = {
    lean: 0.85,
    athletic: 1,
    stocky: 1.3,
    tall_lean: 0.85,
    broad_powerful: 1.4,
  };
  const wMul = buildBoost[config.build ?? "athletic"] ?? 1;
  useFrame((state, delta) => {
    if (!ref.current) return;
    ref.current.position.y = MathUtils.lerp(ref.current.position.y, isActive ? 0 : -0.5, 1 - Math.pow(0.05, delta));
    ref.current.rotation.y = state.clock.elapsedTime * 0.25;
  });
  return (
    <group ref={ref} position={position} scale={[wMul * 1.2, heightScale * 1.2, wMul * 1.2]}>
      <mesh position={[0, 0.06, 0]}>
        <cylinderGeometry args={[0.85, 0.95, 0.12, 48]} />
        <meshStandardMaterial color="#0B0B0F" metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.122, 0]}>
        <cylinderGeometry args={[0.86, 0.86, 0.005, 48]} />
        <meshBasicMaterial color={signatureColor} toneMapped={false} />
      </mesh>
      <mesh position={[0, 1.05, 0]}>
        <capsuleGeometry args={[0.28, 0.7, 8, 14]} />
        <meshStandardMaterial color={signatureColor} emissive={signatureColor} emissiveIntensity={0.7} transparent opacity={0.7} />
      </mesh>
      <mesh position={[0, 1.78, 0]}>
        <sphereGeometry args={[0.22, 18, 18]} />
        <meshStandardMaterial color={signatureColor} emissive={signatureColor} emissiveIntensity={0.8} transparent opacity={0.7} />
      </mesh>
      <mesh position={[0.42, 1.18, 0]} rotation={[0, 0, -0.45]}>
        <capsuleGeometry args={[0.09, 0.6, 4, 8]} />
        <meshStandardMaterial color={signatureColor} emissive={signatureColor} emissiveIntensity={0.6} transparent opacity={0.65} />
      </mesh>
      <mesh position={[-0.42, 1.18, 0]} rotation={[0, 0, 0.45]}>
        <capsuleGeometry args={[0.09, 0.6, 4, 8]} />
        <meshStandardMaterial color={signatureColor} emissive={signatureColor} emissiveIntensity={0.6} transparent opacity={0.65} />
      </mesh>
      <mesh position={[0.15, 0.45, 0]}>
        <capsuleGeometry args={[0.11, 0.6, 4, 8]} />
        <meshStandardMaterial color={signatureColor} emissive={signatureColor} emissiveIntensity={0.6} transparent opacity={0.65} />
      </mesh>
      <mesh position={[-0.15, 0.45, 0]}>
        <capsuleGeometry args={[0.11, 0.6, 4, 8]} />
        <meshStandardMaterial color={signatureColor} emissive={signatureColor} emissiveIntensity={0.6} transparent opacity={0.65} />
      </mesh>
    </group>
  );
}

// Mural shader
const MURAL_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const MURAL_FRAG = /* glsl */ `
  uniform vec3 uColor;
  uniform float uIntensity;
  uniform float uTime;
  varying vec2 vUv;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
  }

  void main() {
    vec2 centered = vUv - vec2(0.5);
    float d = length(centered * vec2(1.0, 1.6));
    float radial = smoothstep(0.85, 0.2, d);

    float band = smoothstep(0.45, 0.5, vUv.x + vUv.y * 0.3) * (1.0 - smoothstep(0.5, 0.6, vUv.x + vUv.y * 0.3));
    band *= 0.18;

    float grain = (hash(vUv * 800.0 + uTime * 0.05) - 0.5) * 0.06;

    vec3 base = mix(vec3(0.04), uColor, radial * 0.85 + band);
    base += grain;
    base *= mix(0.5, 1.0, uIntensity);

    gl_FragColor = vec4(base, 1.0);
  }
`;
