// Licensed under the Apache License, Version 2.0
"use client";

import {
  EffectComposer,
  Bloom,
  Vignette,
  ChromaticAberration,
} from "@react-three/postprocessing";

interface PostEffectsProps {
  bloomStrength?: number;
  vignette?: boolean;
  chromaticAberration?: boolean;
}

export function PostEffects({
  bloomStrength = 0.8,
  vignette = true,
  chromaticAberration = false,
}: PostEffectsProps) {
  return (
    <EffectComposer multisampling={0}>
      <Bloom
        intensity={bloomStrength}
        luminanceThreshold={0.3}
        luminanceSmoothing={0.5}
        radius={0.5}
        mipmapBlur
      />
      {chromaticAberration ? (
        <ChromaticAberration
          offset={[0.0008, 0.0008]}
          radialModulation={false}
          modulationOffset={0}
        />
      ) : (
        <></>
      )}
      {vignette ? <Vignette eskil={false} offset={0.1} darkness={0.6} /> : <></>}
    </EffectComposer>
  );
}
