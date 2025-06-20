<script lang="ts">
  import './app.css';
  import { onMount } from 'svelte';
  import * as THREE from 'three';
  import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
  import { parseAndRenderDawnfile, type TwoDText } from './dawn';

  let mountRef: HTMLDivElement;
  let renderer: THREE.WebGLRenderer;
  let camera: THREE.OrthographicCamera;
  let controls: OrbitControls;
  let scene = new THREE.Scene();
  let twoDTexts: TwoDText[] = [];

  onMount(() => {
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.sortObjects = false;
    mountRef.appendChild(renderer.domElement);
    const aspect = mountRef.clientWidth / mountRef.clientHeight;
    const frustumSize = 100;
    camera = new THREE.OrthographicCamera(
      (frustumSize * aspect) / -2,
      (frustumSize * aspect) / 2,
      frustumSize / 2,
      frustumSize / -2,
      -10000,
      10000000
    );
    camera.position.set(0, 0, 50);
    camera.lookAt(0, 0, 0);
    // Zoom out to fit the scene
    camera.zoom = 0.03;
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    const handleResize = () => {
      if (mountRef) {
        const width = mountRef.clientWidth;
        const height = mountRef.clientHeight;

        renderer.setSize(width, height);
        camera.updateProjectionMatrix();
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    const animate = () => {
      requestAnimationFrame(animate);

      scene.children.forEach((child) => {
        if (child instanceof THREE.Mesh) {
          child.lookAt(camera.position);
        }
      });

      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      controls.dispose();
    };
  });

  const handleFileChange = (event: Event) => {
    const input = event.target as HTMLInputElement;
    const file = input.files && input.files[0];

    if (file) {
      const reader = new FileReader();

      reader.onload = (e) => {
        if (!e.target || !e.target.result) {
          throw new Error('Failed to read file');
        }

        if (typeof e.target.result === 'string') {
          const res = parseAndRenderDawnfile(e.target.result);

          scene.frustumCulled = false;
          res.scene.frustumCulled = false;
          scene.add(res.scene);
          twoDTexts = res.twoDTexts;
        } else {
          throw new Error('File could not be read as text');
        }
      };

      reader.readAsText(file);
    }
  };
</script>

<div class="d-flex flex-column vh-100 bg-light font-sans w-100">
  <header class="bg-white shadow p-4 z-10 rounded-bottom">
    <h1 class="text-2xl fw-bold text-center text-dark">
      SMR-G4-UI Dawnfile Renderer
    </h1>
  </header>
  <main
    class="flex-grow-1 d-flex flex-column align-items-center p-4 position-relative"
  >
    <div class="w-100" style="max-width: 400px; margin-bottom: 1rem;">
      <label for="file-upload" class="visually-hidden"
        >Upload a .pawn file</label
      >
      <input
        id="file-upload"
        type="file"
        accept=".pawn,.dawn,.prim"
        on:change={handleFileChange}
        class="form-control"
      />
    </div>

    <div
      bind:this={mountRef}
      style="width: 100%; height: 100%"
      class="w-100 h-100 border border-secondary rounded shadow-sm bg-white"
    ></div>

    <div
      class="position-absolute top-0 start-0 w-100 h-100"
      style="pointer-events: none;"
    >
      {#each twoDTexts as textObj, index (index)}
        <div
          style="
            position: absolute;
            left: {textObj.x}mm;
            bottom: {textObj.y}mm;
            font-size: {textObj.size}pt;
            color: {textObj.color};
            font-family: {textObj.font};
            white-space: nowrap;
            pointer-events: none;
          "
        >
          {textObj.text}
        </div>
      {/each}
    </div>
  </main>
</div>
