<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import * as THREE from 'three';
	import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
	import { parseAndRenderDawnfile, type TwoDText } from '$lib/dawn';

	/**
	 * The .prim text content to be rendered.
	 */
	export let primText: string;

	let mountRef: HTMLDivElement;
	let renderer: THREE.WebGLRenderer;
	let camera: THREE.OrthographicCamera;
	let controls: OrbitControls;
	let scene = new THREE.Scene();
	let twoDTexts: TwoDText[] = [];

	const handleResize = () => {
		if (mountRef) {
			const width = mountRef.clientWidth;
			const height = mountRef.clientHeight;

			renderer.setSize(width, height);
			camera.updateProjectionMatrix();
		}
	};

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
		camera.zoom = 0.015; // Zoom out to fit the scene
		controls = new OrbitControls(camera, renderer.domElement);
		controls.enableDamping = true;

		// camera.setRotationFromEuler(new THREE.Euler(0, 90, 0));

		window.addEventListener('resize', handleResize);
		handleResize(); // Initial resize

		const animate = () => {
			requestAnimationFrame(animate);

			scene.children.forEach((child) => {
				if (child instanceof THREE.Mesh) {
					child.lookAt(camera.position);
				}
			});

			// controls.update();
			renderer.render(scene, camera);
		};

		animate();

		// Initial rendering of the provided primText
		renderPrimText(primText);
	});

	// Reactively re-render when primText changes
	$: if (primText) {
		renderPrimText(primText);
	}

	function renderPrimText(text: string) {
		// Clear existing objects from the scene before adding new ones
		while (scene.children.length > 0) {
			scene.remove(scene.children[0]);
		}

		try {
			const res = parseAndRenderDawnfile(text);
			scene.frustumCulled = false;
			res.scene.frustumCulled = false;
			scene.add(res.scene);
			twoDTexts = res.twoDTexts;
		} catch (error) {
			console.error('Error parsing or rendering .prim text:', error);
			// Optionally, handle the error in the UI, e.g., display an error message
		}
	}

	onDestroy(() => {
		window.removeEventListener('resize', handleResize);
		renderer.dispose();
		controls.dispose();
		// Clean up the scene to prevent memory leaks, if necessary
		scene.children.forEach((obj) => {
			if (obj instanceof THREE.Mesh) {
				obj.geometry.dispose();
				if (Array.isArray(obj.material)) {
					obj.material.forEach((mat) => mat.dispose());
				} else {
					obj.material.dispose();
				}
			}
		});
	});
</script>

<div bind:this={mountRef} class="h-full w-full" style="min-height: 500px;"></div>

<div class="pointer-events-none absolute inset-0 h-full w-full">
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
