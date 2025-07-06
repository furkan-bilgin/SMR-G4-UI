<script lang="ts">
	import '../app.css';

	let { children } = $props();
</script>

<div class="bg-base-200 flex min-h-screen w-full flex-col font-sans">
	<header class="bg-base-100 z-10 flex justify-center rounded-b p-4 shadow">
		<a href="/" class="text-base-content text-2xl font-bold">SMR-G4</a>
	</header>
	<main class="relative flex flex-1 flex-col items-center p-4">
		{@render children()}
	</main>
</div>
