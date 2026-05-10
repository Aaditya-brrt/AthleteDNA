// Licensed under the Apache License, Version 2.0
"use client";

import { Canvas } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import { AvatarScene, type AvatarConfig } from "@/components/three/AvatarScene";
import { PostEffects } from "@/components/three/PostEffects";

interface SidebarAvatarProps {
  config: AvatarConfig;
  color: string;
}

export function SidebarAvatar({ config, color }: SidebarAvatarProps) {
  return (
    <Canvas
      camera={{ position: [0, 0.4, 4], fov: 50 }}
      dpr={[1, 2]}
      gl={{ antialias: true }}
      style={{ background: "#0B0B0F" }}
    >
      <ambientLight intensity={0.6} />
      <pointLight position={[3, 3, 3]} intensity={1} color={color} />
      <pointLight position={[-3, 0, 2]} intensity={0.4} color="#ffffff" />
      <Float speed={1.5} rotationIntensity={0.05} floatIntensity={0.15}>
        <AvatarScene config={config} color={color} emissive={0.6} ignite rotate />
      </Float>
      <PostEffects bloomStrength={0.7} vignette={false} />
    </Canvas>
  );
}
