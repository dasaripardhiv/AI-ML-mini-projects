'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export const StadiumCanvas: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // 1. Create Scene & Camera
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2('#030510', 0.08);

    const camera = new THREE.PerspectiveCamera(
      60,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 2, 6);
    camera.lookAt(0, 0, 0);

    // 2. Create Renderer
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);

    // 3. Add Lights
    const ambientLight = new THREE.AmbientLight('#ffffff', 0.1);
    scene.add(ambientLight);

    // Spotlights (representing stadium floodlights)
    const spotLight1 = new THREE.SpotLight('#00ff87', 20, 15, Math.PI / 4, 0.5, 1);
    spotLight1.position.set(-4, 5, 2);
    scene.add(spotLight1);

    const spotLight2 = new THREE.SpotLight('#00e5ff', 20, 15, Math.PI / 4, 0.5, 1);
    spotLight2.position.set(4, 5, -2);
    scene.add(spotLight2);

    const pointLight = new THREE.PointLight('#00ff87', 5, 10);
    pointLight.position.set(0, 0, 0);
    scene.add(pointLight);

    // 4. Create 3D Football Mesh
    const ballGroup = new THREE.Group();

    // Inner glowing sphere
    const sphereGeo = new THREE.SphereGeometry(1.5, 16, 16);
    const sphereMat = new THREE.MeshBasicMaterial({
      color: '#081a2e',
      transparent: true,
      opacity: 0.8,
    });
    const innerSphere = new THREE.Mesh(sphereGeo, sphereMat);
    ballGroup.add(innerSphere);

    // Football wireframe pattern (using Icosahedron to get pentagon/hexagon feels)
    const icosaGeo = new THREE.IcosahedronGeometry(1.52, 2);
    const wireframeMat = new THREE.MeshBasicMaterial({
      color: '#00ff87',
      wireframe: true,
      transparent: true,
      opacity: 0.9,
    });
    const wireframeMesh = new THREE.Mesh(icosaGeo, wireframeMat);
    ballGroup.add(wireframeMesh);

    // Add glowing panels
    const panelGeo = new THREE.IcosahedronGeometry(1.51, 1);
    const panelMat = new THREE.MeshBasicMaterial({
      color: '#00e5ff',
      wireframe: true,
      transparent: true,
      opacity: 0.3,
    });
    const panelMesh = new THREE.Mesh(panelGeo, panelMat);
    ballGroup.add(panelMesh);

    scene.add(ballGroup);

    // 5. Create Pitch Grid (Ground representation)
    const gridHelper = new THREE.GridHelper(30, 30, '#00ff87', '#0e2338');
    gridHelper.position.y = -2;
    // @ts-ignore
    gridHelper.material.opacity = 0.25;
    // @ts-ignore
    gridHelper.material.transparent = true;
    scene.add(gridHelper);

    // 6. Floating Particles (Stadium crowd/dust lights)
    const particleCount = 100;
    const particleGeometry = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      particlePositions[i] = (Math.random() - 0.5) * 20; // x
      particlePositions[i + 1] = (Math.random() - 0.5) * 10 + 2; // y
      particlePositions[i + 2] = (Math.random() - 0.5) * 20; // z
    }

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));

    // Particle texture (simple point)
    const particleMaterial = new THREE.PointsMaterial({
      color: '#00ff87',
      size: 0.06,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);

    // 7. Handle Resize
    const handleResize = () => {
      if (!containerRef.current) return;
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;

      camera.aspect = width / height;
      camera.updateProjectionMatrix();

      renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    // 8. Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      const elapsedTime = clock.getElapsedTime();

      // Spin ball
      ballGroup.rotation.y = elapsedTime * 0.15;
      ballGroup.rotation.x = elapsedTime * 0.08;

      // Orbit spotlights slowly
      spotLight1.position.x = Math.sin(elapsedTime * 0.5) * 5;
      spotLight1.position.z = Math.cos(elapsedTime * 0.5) * 5;

      spotLight2.position.x = -Math.sin(elapsedTime * 0.5) * 5;
      spotLight2.position.z = -Math.cos(elapsedTime * 0.5) * 5;

      // Make ball levitate slightly
      ballGroup.position.y = Math.sin(elapsedTime * 0.7) * 0.15;

      // Animate particles
      const positions = particles.geometry.attributes.position.array as Float32Array;
      for (let i = 1; i < particleCount * 3; i += 3) {
        positions[i] -= 0.005; // fall slowly
        if (positions[i] < -2) {
          positions[i] = 8; // reset to top
        }
      }
      particles.geometry.attributes.position.needsUpdate = true;

      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return <div ref={containerRef} className="absolute inset-0 w-full h-full -z-10" />;
};
