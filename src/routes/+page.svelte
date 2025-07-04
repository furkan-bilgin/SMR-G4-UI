<script lang="ts">
	import "../app.css";
	import { onMount } from 'svelte';
	import * as THREE from 'three';
	import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
	import { parseAndRenderDawnfile, type TwoDText } from '$lib/dawn';

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
<div class="flex flex-col min-h-screen bg-base-200 font-sans w-full">
	<header class="bg-base-100 shadow p-4 z-10 rounded-b">
		<h1 class="text-2xl font-bold text-center text-base-content">SMR-G4-UI Dawnfile Renderer</h1>
	</header>
	<main class="flex-1 flex flex-col items-center p-4 relative">
		<div class="w-full max-w-md mb-4">
			<label for="file-upload" class="sr-only">Upload a .pawn file</label>
			<input
				id="file-upload"
				type="file"
				accept=".pawn,.dawn,.prim"
				on:change={handleFileChange}
				class="file-input file-input-bordered w-full"
			/>
		</div>

		<div
			bind:this={mountRef}
			class="w-full h-full border border-base-300 rounded shadow bg-base-100"
			style="min-height: 400px;"
		></div>

		<div class="absolute inset-0 w-full h-full pointer-events-none">
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
