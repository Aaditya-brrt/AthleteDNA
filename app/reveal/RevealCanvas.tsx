// Licensed under the Apache License, Version 2.0
"use client";

import { Canvas } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import { Suspense } from "react";
import { ParticleCloud } from "@/components/three/ParticleCloud";
import { AvatarScene, type AvatarConfig } from "@/components/three/AvatarScene";
import { PostEffects } from "@/components/three/PostEffects";

interface RevealCanvasProps {
  phase: 0 | 1 | 2 | 3 | 4;
  config: AvatarConfig;
  archetypeColor: string;
  archetypeName: string;
}

export function RevealCanvas({ phase, config, archetypeColor, archetypeName }: RevealCanvasProps) {
  const showParticles = phase >= 1 && phase < 3;
  const ignite = phase >= 3;
  const showText = phase >= 4;
  const bloomStrength = phase === 3 ? 1.4 : phase >= 4 ? 0.85 : 0.4;

  return (
    <Canvas
      camera={{ position: [0, 0.4, 5], fov: 50 }}
      dpr={[1, 2]}
      gl={{ antialias: true }}
      style={{ background: "#0B0B0F" }}
    >
      <ambientLight intensity={1.2} />
      <pointLight position={[5, 5, 5]} intensity={2.5} color={archetypeColor} />
      <pointLight position={[-5, 2, 3]} intensity={1.2} color="#FDFBF7" />
      <directionalLight position={[0, 5, 5]} intensity={1.2} />

      {showParticles && <ParticleCloud count={2000} active={phase === 1} />}

      {phase >= 2 && (
        <AvatarScene
          config={config}
          color={ignite ? archetypeColor : "#3F3F46"}
          emissive={ignite ? 1.5 : 0}
          ignite={ignite}
          rotate
        />
      )}

      <Suspense fallback={null}>
        {showText && (
          <Text
            position={[0, 1.95, 0]}
            fontSize={0.3}
            color={archetypeColor}
            anchorX="center"
            anchorY="middle"
            letterSpacing={0.04}
            maxWidth={6}
          >
            {archetypeName}
          </Text>
        )}
      </Suspense>

      <PostEffects bloomStrength={bloomStrength} vignette />
    </Canvas>
  );
}
