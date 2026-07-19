'use client'

import { Suspense, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { MeshDistortMaterial, OrbitControls } from '@react-three/drei'
import * as THREE from 'three'

function randomSpherePoint(minRadius: number, maxRadius: number): THREE.Vector3 {
  const u = Math.random()
  const v = Math.random()
  const theta = 2 * Math.PI * u
  const phi = Math.acos(2 * v - 1)
  const r = minRadius + Math.random() * (maxRadius - minRadius)
  return new THREE.Vector3(
    r * Math.sin(phi) * Math.cos(theta),
    r * Math.sin(phi) * Math.sin(theta),
    r * Math.cos(phi)
  )
}

function MainSphere() {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame(state => {
    if (!meshRef.current) return
    meshRef.current.rotation.y += 0.004
    meshRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.9) * 0.18
  })

  return (
    <mesh ref={meshRef} scale={2.2}>
      <sphereGeometry args={[1, 64, 64]} />
      <MeshDistortMaterial
        color="#D4AF37"
        emissive="#A87C28"
        emissiveIntensity={0.45}
        metalness={0.9}
        roughness={0.1}
        distort={0.35}
        speed={1.8}
      />
    </mesh>
  )
}

function InnerRing() {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame(() => {
    if (!meshRef.current) return
    meshRef.current.rotation.y += 0.004
  })

  return (
    <mesh ref={meshRef} rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[2.6, 0.008, 16, 100]} />
      <meshStandardMaterial
        color="#D4AF37"
        emissive="#E6C76A"
        emissiveIntensity={0.85}
        metalness={0.6}
        roughness={0.2}
      />
    </mesh>
  )
}

function OuterRing() {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame(() => {
    if (!meshRef.current) return
    meshRef.current.rotation.y -= 0.0025
  })

  return (
    <mesh ref={meshRef} rotation={[Math.PI / 3, 0, 0]}>
      <torusGeometry args={[3.0, 0.004, 16, 100]} />
      <meshStandardMaterial
        color="#E6C76A"
        emissive="#D4AF37"
        emissiveIntensity={0.5}
        metalness={0.6}
        roughness={0.2}
      />
    </mesh>
  )
}

type OrbitingSphereProps = {
  radius: number
  speed: number
  size: number
  color: string
  phase: number
  tilt?: number
}

function OrbitingSphere({ radius, speed, size, color, phase, tilt = 0 }: OrbitingSphereProps) {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame(state => {
    if (!meshRef.current) return
    const t = state.clock.elapsedTime * speed + phase
    meshRef.current.position.x = Math.cos(t) * radius
    meshRef.current.position.z = Math.sin(t) * radius
    meshRef.current.position.y = Math.sin(t * 1.6 + tilt) * 0.35
    meshRef.current.rotation.x += 0.03
    meshRef.current.rotation.y += 0.04
  })

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[size, 24, 24]} />
      <meshStandardMaterial
        color={color}
        metalness={1}
        roughness={0.1}
        emissive="#D4AF37"
        emissiveIntensity={1.2}
      />
    </mesh>
  )
}

type ParticleData = {
  position: THREE.Vector3
  size: number
  speed: number
  axis: THREE.Vector3
  isBox: boolean
}

function createParticles(): ParticleData[] {
  return Array.from({ length: 30 }, () => ({
    position: randomSpherePoint(2.5, 4.5),
    size: 0.03 + Math.random() * 0.04,
    speed: 0.2 + Math.random() * 0.4,
    axis: new THREE.Vector3(
      Math.random() - 0.5,
      Math.random() - 0.5,
      Math.random() - 0.5
    ).normalize(),
    isBox: Math.random() > 0.5,
  }))
}

const PARTICLES = createParticles()

function Particles() {
  const groupRef = useRef<THREE.Group>(null)
  const meshRefs = useRef<(THREE.Mesh | null)[]>([])

  const particles = PARTICLES

  useFrame(state => {
    const t = state.clock.elapsedTime
    particles.forEach((p, i) => {
      const mesh = meshRefs.current[i]
      if (!mesh) return
      mesh.rotation.x = t * p.speed * p.axis.x
      mesh.rotation.y = t * p.speed * p.axis.y
      mesh.rotation.z = t * p.speed * p.axis.z
      mesh.position.y = p.position.y + Math.sin(t * p.speed * 2 + i) * 0.08
    })
    if (groupRef.current) {
      groupRef.current.rotation.y = t * 0.06
    }
  })

  return (
    <group ref={groupRef}>
      {particles.map((p, i) => (
        <mesh
          key={i}
          ref={el => {
            meshRefs.current[i] = el
          }}
          position={p.position}
        >
          {p.isBox ? (
            <boxGeometry args={[p.size, p.size, p.size]} />
          ) : (
            <sphereGeometry args={[p.size, 8, 8]} />
          )}
          <meshStandardMaterial
            color="#E6C76A"
            metalness={0.8}
            roughness={0.1}
            emissive="#D4AF37"
            emissiveIntensity={2.2}
          />
        </mesh>
      ))}
    </group>
  )
}

function Scene() {
  return (
    <>
      <ambientLight intensity={1.2} />
      <pointLight position={[3, 3, 3]} intensity={3} color="#E6C76A" />
      <pointLight position={[-3, -2, -3]} intensity={1.5} color="#ffffff" />
      <pointLight position={[0, -4, 2]} intensity={1} color="#D4AF37" />
      <spotLight position={[0, 10, 0]} intensity={2} angle={0.4} penumbra={0.5} color="#D4AF37" />

      <MainSphere />
      <InnerRing />
      <OuterRing />

      <OrbitingSphere radius={3.2} speed={1.1} size={0.2} color="#D4AF37" phase={0} />
      <OrbitingSphere radius={2.6} speed={1.4} size={0.15} color="#E6C76A" phase={1.2} tilt={0.8} />
      <OrbitingSphere radius={3.6} speed={0.95} size={0.18} color="#C9A84C" phase={2.4} tilt={1.6} />

      <Particles />

      <OrbitControls
        enableZoom={false}
        enablePan={false}
        autoRotate
        autoRotateSpeed={0.5}
        maxPolarAngle={Math.PI / 1.8}
        minPolarAngle={Math.PI / 3}
      />
    </>
  )
}

export default function BeautyOrb3D() {
  return (
    <Canvas
      camera={{ position: [0, 0, 5], fov: 45 }}
      gl={{ alpha: true, antialias: true }}
      style={{ background: 'transparent' }}
      dpr={[1, 2]}
    >
      <Suspense fallback={null}>
        <Scene />
      </Suspense>
    </Canvas>
  )
}
