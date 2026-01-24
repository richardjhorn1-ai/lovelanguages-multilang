import { useCurrentFrame, interpolate } from 'remotion';
import { Canvas } from '@react-three/fiber';
import { RoundedBox, Html, Environment, ContactShadows } from '@react-three/drei';
import { useRef, Suspense } from 'react';
import * as THREE from 'three';

interface PhoneFrame3DProps {
  children: React.ReactNode;
  rotateX?: number;
  rotateY?: number;
  rotateZ?: number;
  scale?: number;
  floating?: boolean;
}

// The 3D phone mesh
const PhoneMesh: React.FC<{
  children: React.ReactNode;
  rotateX: number;
  rotateY: number;
  rotateZ: number;
  floating: boolean;
}> = ({ children, rotateX, rotateY, rotateZ, floating }) => {
  const groupRef = useRef<THREE.Group>(null);
  const frame = useCurrentFrame();

  // Floating animation
  const floatY = floating
    ? Math.sin(frame * 0.05) * 0.05
    : 0;

  // Subtle idle rotation
  const idleRotateY = floating
    ? Math.sin(frame * 0.02) * 0.03
    : 0;

  return (
    <group
      ref={groupRef}
      rotation={[
        THREE.MathUtils.degToRad(rotateX),
        THREE.MathUtils.degToRad(rotateY) + idleRotateY,
        THREE.MathUtils.degToRad(rotateZ),
      ]}
      position={[0, floatY, 0]}
      scale={1.4}
    >
      {/* Phone body - metallic frame */}
      <RoundedBox
        args={[2.4, 5, 0.25]}
        radius={0.15}
        smoothness={4}
      >
        <meshStandardMaterial
          color="#1a1a1a"
          metalness={0.9}
          roughness={0.1}
        />
      </RoundedBox>

      {/* Screen bezel */}
      <RoundedBox
        args={[2.2, 4.8, 0.02]}
        radius={0.12}
        smoothness={4}
        position={[0, 0, 0.13]}
      >
        <meshStandardMaterial
          color="#000000"
          metalness={0.5}
          roughness={0.8}
        />
      </RoundedBox>

      {/* Screen with content - using Html from drei */}
      <Html
        transform
        occlude
        position={[0, 0, 0.14]}
        style={{
          width: 220,
          height: 480,
          overflow: 'hidden',
          borderRadius: 20,
          background: '#fdfcfd',
        }}
        distanceFactor={1.6}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            overflow: 'hidden',
            borderRadius: 20,
          }}
        >
          {children}
        </div>
      </Html>

      {/* Camera notch */}
      <mesh position={[0, 2.2, 0.14]} rotation={[0, 0, Math.PI / 2]}>
        <capsuleGeometry args={[0.08, 0.4, 8, 16]} />
        <meshStandardMaterial color="#000000" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Side buttons */}
      <mesh position={[-1.25, 0.8, 0]}>
        <boxGeometry args={[0.05, 0.4, 0.1]} />
        <meshStandardMaterial color="#2a2a2a" metalness={0.9} roughness={0.1} />
      </mesh>
      <mesh position={[-1.25, 0.2, 0]}>
        <boxGeometry args={[0.05, 0.25, 0.1]} />
        <meshStandardMaterial color="#2a2a2a" metalness={0.9} roughness={0.1} />
      </mesh>
      <mesh position={[1.25, 0.5, 0]}>
        <boxGeometry args={[0.05, 0.6, 0.1]} />
        <meshStandardMaterial color="#2a2a2a" metalness={0.9} roughness={0.1} />
      </mesh>
    </group>
  );
};

export const PhoneFrame3D: React.FC<PhoneFrame3DProps> = ({
  children,
  rotateX = -5,
  rotateY = 15,
  rotateZ = 0,
  scale = 1,
  floating = true,
}) => {
  const frame = useCurrentFrame();

  // Entrance animation
  const entranceScale = interpolate(frame, [0, 20], [0.8, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const entranceOpacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        width: 600,
        height: 900,
        opacity: entranceOpacity,
        transform: `scale(${entranceScale * scale})`,
        position: 'relative',
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 3.2], fov: 50 }}
        style={{ background: 'transparent' }}
        gl={{ alpha: true, antialias: true, preserveDrawingBuffer: true }}
      >
        <Suspense fallback={null}>
          {/* Lighting */}
          <ambientLight intensity={0.4} />
          <directionalLight
            position={[5, 5, 5]}
            intensity={1}
            castShadow
          />
          <directionalLight
            position={[-5, 5, -5]}
            intensity={0.5}
          />
          <pointLight position={[0, 5, 0]} intensity={0.3} />

          {/* Environment for reflections */}
          <Environment preset="city" />

          {/* The phone */}
          <PhoneMesh
            rotateX={rotateX}
            rotateY={rotateY}
            rotateZ={rotateZ}
            floating={floating}
          >
            {children}
          </PhoneMesh>

          {/* Ground shadow */}
          <ContactShadows
            position={[0, -3.5, 0]}
            opacity={0.3}
            scale={12}
            blur={2.5}
            far={5}
          />
        </Suspense>
      </Canvas>
    </div>
  );
};

// Animated version with camera path
interface AnimatedPhoneProps {
  children: React.ReactNode;
  cameraPath?: 'orbit' | 'showcase' | 'static';
}

export const AnimatedPhone3D: React.FC<AnimatedPhoneProps> = ({
  children,
  cameraPath = 'showcase',
}) => {
  const frame = useCurrentFrame();

  // Different camera/rotation paths
  let rotateX = -5;
  let rotateY = 15;
  let rotateZ = 0;

  if (cameraPath === 'orbit') {
    // Slow orbit around the phone
    rotateY = interpolate(frame, [0, 300], [0, 360], {
      extrapolateRight: 'extend',
    });
  } else if (cameraPath === 'showcase') {
    // Cinematic showcase movement
    rotateY = interpolate(
      frame,
      [0, 60, 120, 180, 240],
      [25, -15, 10, -10, 15],
      { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
    );
    rotateX = interpolate(
      frame,
      [0, 60, 120, 180, 240],
      [-8, -3, -10, -5, -8],
      { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
    );
  }

  return (
    <PhoneFrame3D
      rotateX={rotateX}
      rotateY={rotateY}
      rotateZ={rotateZ}
      floating={true}
      scale={1.3}
    >
      {children}
    </PhoneFrame3D>
  );
};
