"use client";

import React, { useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Points, PointMaterial, Stars, Float } from "@react-three/drei";
import * as random from "maath/random/dist/maath-random.cjs";

function HelixDNA(props: any) {
  const pointsRef = useRef<any>(null);

  const count = 4000;
  const radius = 2.5;
  const turns = 6;
  const length = 12;

  const [positions] = useState(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const t = (i / count) * turns * Math.PI * 2;
      const x = Math.cos(t) * radius;
      const z = Math.sin(t) * radius;
      const y = (i / count) * length - length / 2;

      // Add some random noise/scatter
      pos[i * 3] = x + (Math.random() - 0.5) * 0.3;
      pos[i * 3 + 1] = y + (Math.random() - 0.5) * 0.3;
      pos[i * 3 + 2] = z + (Math.random() - 0.5) * 0.3;
    }
    return pos;
  });

  const [positions2] = useState(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const t = (i / count) * turns * Math.PI * 2 + Math.PI;
      const x = Math.cos(t) * radius;
      const z = Math.sin(t) * radius;
      const y = (i / count) * length - length / 2;

      pos[i * 3] = x + (Math.random() - 0.5) * 0.3;
      pos[i * 3 + 1] = y + (Math.random() - 0.5) * 0.3;
      pos[i * 3 + 2] = z + (Math.random() - 0.5) * 0.3;
    }
    return pos;
  });

  useFrame((state, delta) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += delta * 0.15;
      pointsRef.current.rotation.z = Math.sin(state.clock.getElapsedTime() * 0.2) * 0.1;
    }
  });

  return (
    <group ref={pointsRef} rotation={[0, 0, Math.PI / 6]}>
      <Points positions={positions} stride={3} frustumCulled={false} {...props}>
        <PointMaterial
          transparent
          color="#06b6d4"
          size={0.025}
          sizeAttenuation={true}
          depthWrite={false}
          opacity={0.8}
        />
      </Points>

      <Points positions={positions2} stride={3} frustumCulled={false} {...props}>
        <PointMaterial
          transparent
          color="#6366f1"
          size={0.025}
          sizeAttenuation={true}
          depthWrite={false}
          opacity={0.8}
        />
      </Points>
    </group>
  );
}

function FloatingParticles() {
  const ref = useRef<any>(null);
  const [sphere] = useState(() =>
    random.inSphere(new Float32Array(3000), { radius: 15 })
  );

  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.rotation.x -= delta / 15;
      ref.current.rotation.y -= delta / 20;
    }
  });

  return (
    <group rotation={[0, 0, Math.PI / 4]}>
      <Points ref={ref} positions={sphere as any} stride={3} frustumCulled={false}>
        <PointMaterial
          transparent
          color="#ffffff"
          size={0.015}
          sizeAttenuation={true}
          depthWrite={false}
          opacity={0.4}
        />
      </Points>
    </group>
  );
}

export default function Background3D({ variant = "full" }: { variant?: "full" | "subtle" }) {
  return (
    <div className="absolute inset-0 z-0 pointer-events-none">
      <Canvas camera={{ position: [0, 0, variant === "full" ? 8 : 12], fov: 60 }}>
        <ambientLight intensity={0.5} />

        <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
          <HelixDNA />
        </Float>

        <FloatingParticles />
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

        {variant === "full" && (
          <fog attach="fog" args={['#000000', 5, 25]} />
        )}
      </Canvas>
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/80" />
    </div>
  );
}
