// frontend/src/components/ModelViewer.jsx
import React, { Suspense, useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Center, Html } from '@react-three/drei';
import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader';

// Robot model component that loads OBJ + MTL
function RobotModel({ objUrl, mtlUrl }) {
  const [model, setModel] = useState(null);
  const [error, setError] = useState(null);
  const meshRef = useRef();

  useEffect(() => {
    const mtlLoader = new MTLLoader();

    // Set the path for material textures
    const basePath = mtlUrl.substring(0, mtlUrl.lastIndexOf('/') + 1);
    mtlLoader.setPath(basePath);

    const mtlFileName = mtlUrl.substring(mtlUrl.lastIndexOf('/') + 1);

    mtlLoader.load(
      mtlFileName,
      (materials) => {
        materials.preload();

        const objLoader = new OBJLoader();
        objLoader.setMaterials(materials);
        objLoader.setPath(basePath);

        const objFileName = objUrl.substring(objUrl.lastIndexOf('/') + 1);

        objLoader.load(
          objFileName,
          (object) => {
            // Center and scale the model
            const box = new THREE.Box3().setFromObject(object);
            const center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());

            // Normalize size
            const maxDim = Math.max(size.x, size.y, size.z);
            const scale = 3 / maxDim;
            object.scale.multiplyScalar(scale);

            // Center the model
            object.position.sub(center.multiplyScalar(scale));

            // Enable shadows on all meshes
            object.traverse((child) => {
              if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
              }
            });

            setModel(object);
          },
          undefined,
          (err) => {
            console.error('Error loading OBJ:', err);
            setError('Failed to load model');
          }
        );
      },
      undefined,
      (err) => {
        console.error('Error loading MTL:', err);
        // Try loading OBJ without materials
        const objLoader = new OBJLoader();
        objLoader.load(
          objUrl,
          (object) => {
            const box = new THREE.Box3().setFromObject(object);
            const center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z);
            const scale = 3 / maxDim;
            object.scale.multiplyScalar(scale);
            object.position.sub(center.multiplyScalar(scale));

            // Apply default material
            object.traverse((child) => {
              if (child.isMesh) {
                child.material = new THREE.MeshStandardMaterial({
                  color: '#00ff88',
                  metalness: 0.5,
                  roughness: 0.5,
                });
                child.castShadow = true;
                child.receiveShadow = true;
              }
            });

            setModel(object);
          },
          undefined,
          (err) => setError('Failed to load model')
        );
      }
    );
  }, [objUrl, mtlUrl]);

  // Slow rotation
  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.003;
    }
  });

  if (error) {
    return (
      <Html center>
        <div style={{ color: '#ef4444', fontFamily: 'monospace' }}>{error}</div>
      </Html>
    );
  }

  if (!model) {
    return (
      <Html center>
        <div style={{ color: '#22c55e', fontFamily: 'monospace' }}>LOADING...</div>
      </Html>
    );
  }

  return (
    <group ref={meshRef}>
      <primitive object={model} />
    </group>
  );
}

// Fallback cube if no model URL provided
function FallbackCube() {
  const meshRef = useRef();

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.01;
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime) * 0.1;
    }
  });

  return (
    <mesh ref={meshRef}>
      <boxGeometry args={[2, 2, 2]} />
      <meshStandardMaterial
        color="#00ff88"
        metalness={0.8}
        roughness={0.2}
        emissive="#00ff88"
        emissiveIntensity={0.2}
      />
    </mesh>
  );
}

// Main ModelViewer component
function ModelViewer({ modelUrl, height = '300px', showControls = true }) {
  const mtlUrl = modelUrl ? modelUrl.replace('.obj', '.mtl') : null;

  return (
    <div style={{
      width: '100%',
      height: height,
      background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)',
      borderRadius: '8px',
      border: '1px solid var(--neon-green)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Grid overlay effect */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `
          linear-gradient(rgba(0,255,136,0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0,255,136,0.03) 1px, transparent 1px)
        `,
        backgroundSize: '20px 20px',
        pointerEvents: 'none',
        zIndex: 1
      }} />

      <Canvas
        shadows
        camera={{ position: [4, 3, 4], fov: 50 }}
        style={{ background: 'transparent' }}
      >
        {/* Lighting setup */}
        <ambientLight intensity={0.6} />
        <directionalLight
          position={[5, 10, 5]}
          intensity={1}
          castShadow
          shadow-mapSize={[1024, 1024]}
        />
        <directionalLight position={[-5, 5, -5]} intensity={0.5} />
        <pointLight position={[0, 5, 0]} intensity={0.5} color="#ffffff" />

        <Suspense fallback={null}>
          {modelUrl ? (
            <RobotModel objUrl={modelUrl} mtlUrl={mtlUrl} />
          ) : (
            <FallbackCube />
          )}
        </Suspense>

        {showControls && (
          <OrbitControls
            enablePan={false}
            enableZoom={true}
            minDistance={2}
            maxDistance={10}
            autoRotate={false}
          />
        )}

        {/* Ground plane */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.5, 0]} receiveShadow>
          <planeGeometry args={[20, 20]} />
          <meshStandardMaterial color="#0a0a0a" transparent opacity={0.5} />
        </mesh>
      </Canvas>

      {/* Corner label */}
      <div style={{
        position: 'absolute',
        top: '10px',
        left: '10px',
        color: 'var(--neon-green)',
        fontFamily: 'monospace',
        fontSize: '10px',
        opacity: 0.7,
        zIndex: 2
      }}>
        [3D MODEL VIEWER]
      </div>

      <div style={{
        position: 'absolute',
        bottom: '10px',
        right: '10px',
        color: 'var(--text-secondary)',
        fontFamily: 'monospace',
        fontSize: '10px',
        zIndex: 2
      }}>
        DRAG TO ROTATE | SCROLL TO ZOOM
      </div>
    </div>
  );
}

export default ModelViewer;
