import { useRef, useMemo, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

/* ──────────────────────────────────────────────────────────
   Hyperspeed – starfield light-speed tunnel
   Pramanik teal brand tinted, built with React Three Fiber
────────────────────────────────────────────────────────── */

const STREAK_COUNT = 600;

function StarStreaks({ speed = 1.2 }) {
  const pointsRef = useRef();

  const { positions, colors } = useMemo(() => {
    const positions = [];
    const colors    = [];
    const c1 = new THREE.Color("#2dd4bf"); // teal primary
    const c2 = new THREE.Color("#34d399"); // emerald accent
    const c3 = new THREE.Color("#e2e8f0"); // off-white

    for (let i = 0; i < STREAK_COUNT; i++) {
      // Cylindrical distribution around camera axis
      const angle = Math.random() * Math.PI * 2;
      const radius = 0.3 + Math.random() * 2;
      positions.push(
        Math.cos(angle) * radius,           // x
        Math.sin(angle) * radius,           // y
        (Math.random() - 0.5) * 20          // z depth
      );

      // Pick a color tinted toward brand palette
      const t = Math.random();
      const base = t < 0.4 ? c1 : t < 0.7 ? c2 : c3;
      const tinted = base.clone().lerp(c3, Math.random() * 0.3);
      colors.push(tinted.r, tinted.g, tinted.b);
    }
    return {
      positions: new Float32Array(positions),
      colors:    new Float32Array(colors),
    };
  }, []);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("color",    new THREE.BufferAttribute(colors,    3));
    return geo;
  }, [positions, colors]);

  useFrame((_, delta) => {
    if (!pointsRef.current) return;
    const arr = pointsRef.current.geometry.attributes.position.array;
    for (let i = 0; i < STREAK_COUNT; i++) {
      arr[i * 3 + 2] += speed * delta * 5;
      if (arr[i * 3 + 2] > 10) arr[i * 3 + 2] = -10;
    }
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        vertexColors
        size={0.045}
        sizeAttenuation
        transparent
        opacity={0.9}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

/* Central orb pulsing glow */
function GlowOrb() {
  const ref = useRef();
  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.material.opacity = 0.04 + Math.sin(clock.elapsedTime * 0.9) * 0.03;
  });
  return (
    <mesh ref={ref} position={[0, 0, -4]}>
      <sphereGeometry args={[0.8, 32, 32]} />
      <meshBasicMaterial color="#2dd4bf" transparent opacity={0.06} />
    </mesh>
  );
}

/* ── Canvas wrapper with error guard ── */
function Scene({ speed }) {
  return (
    <>
      <StarStreaks speed={speed} />
      <GlowOrb />
    </>
  );
}

export default function Hyperspeed({ speed = 1.2, className = "" }) {
  return (
    <div
      className={`absolute inset-0 ${className}`}
      style={{ zIndex: 0, background: "transparent" }}
    >
      <Canvas
        camera={{ position: [0, 0, 3], fov: 75, near: 0.1, far: 100 }}
        gl={{ alpha: true, antialias: false, powerPreference: "high-performance" }}
        style={{ width: "100%", height: "100%", background: "transparent" }}
        dpr={Math.min(window.devicePixelRatio, 2)}
      >
        <Suspense fallback={null}>
          <Scene speed={speed} />
        </Suspense>
      </Canvas>
    </div>
  );
}
