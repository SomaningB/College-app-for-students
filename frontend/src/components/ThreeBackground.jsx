import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Float, MeshTransmissionMaterial, Environment } from '@react-three/drei'
import * as THREE from 'three'

function FloatingShape({ position, scale, speed, type }) {
  const meshRef = useRef()
  const initialY = position[1]

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += speed * 0.01
      meshRef.current.rotation.y += speed * 0.015
      meshRef.current.position.y = initialY + Math.sin(state.clock.elapsedTime * speed * 0.5) * 0.5
    }
  })

  const geometry = useMemo(() => {
    switch (type) {
      case 'torus': return <torusGeometry args={[scale, scale * 0.3, 16, 32]} />
      case 'octahedron': return <octahedronGeometry args={[scale]} />
      case 'icosahedron': return <icosahedronGeometry args={[scale, 0]} />
      case 'torusKnot': return <torusKnotGeometry args={[scale, scale * 0.2, 64, 8]} />
      default: return <sphereGeometry args={[scale, 32, 32]} />
    }
  }, [type, scale])

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
      <mesh ref={meshRef} position={position}>
        {geometry}
        <MeshTransmissionMaterial
          color="#6366f1"
          transmission={0.9}
          thickness={0.5}
          roughness={0.1}
          chromaticAberration={0.1}
          backside
        />
      </mesh>
    </Float>
  )
}

function ParticleField() {
  const particlesRef = useRef()
  const count = 200

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 20
      pos[i * 3 + 1] = (Math.random() - 0.5) * 20
      pos[i * 3 + 2] = (Math.random() - 0.5) * 20
    }
    return pos
  }, [])

  useFrame((state) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y += 0.0005
      particlesRef.current.rotation.x += 0.0002
    }
  })

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.03} color="#6366f1" transparent opacity={0.6} sizeAttenuation />
    </points>
  )
}

function GridFloor() {
  return (
    <gridHelper args={[30, 30, '#2a2a40', '#1a1a2e']} position={[0, -5, 0]} rotation={[0, 0, 0]} />
  )
}

function Scene() {
  return (
    <>
      <color attach="background" args={['#0f0f1a']} />
      <fog attach="fog" args={['#0f0f1a', 8, 25]} />
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={0.5} color="#6366f1" />
      <pointLight position={[-10, -10, -10]} intensity={0.3} color="#8b5cf6" />

      <FloatingShape position={[-3, 2, -2]} scale={0.4} speed={1.5} type="torus" />
      <FloatingShape position={[4, -1, -3]} scale={0.35} speed={1.2} type="octahedron" />
      <FloatingShape position={[-2, -2, 2]} scale={0.45} speed={0.8} type="icosahedron" />
      <FloatingShape position={[3, 3, 1]} scale={0.3} speed={2} type="torusKnot" />
      <FloatingShape position={[-4, 0, -1]} scale={0.25} speed={1} type="sphere" />
      <FloatingShape position={[1, -3, -2]} scale={0.5} speed={0.6} type="torus" />

      <ParticleField />
      <GridFloor />
    </>
  )
}

export default function ThreeBackground() {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      zIndex: 0,
      pointerEvents: 'none'
    }}>
      <Canvas camera={{ position: [0, 0, 8], fov: 60 }}>
        <Scene />
      </Canvas>
    </div>
  )
}