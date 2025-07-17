<script lang="ts">
	import Link from '$lib/Link.svelte';
	import '../app.css';

	let { children } = $props();
</script>

<div class="bg-base-200 flex min-h-screen w-full flex-col font-sans">
	<header
		class="bg-base-100 z-10 flex w-full items-center justify-between rounded-b p-2 ps-8 pe-8 shadow"
	>
		<img
			src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ8woof6gaBMrdvcpRhb4Tr2fy7ca-5F9YcEw&s"
			alt="ENRG Logo"
			class="inline-block align-middle"
			width="65"
		/>
		<Link to="/" className="text-xl font-bold">SMR-G4</Link>
		<div></div>
	</header>
	<main class="relative flex flex-1 flex-col items-center p-4">
		{@render children()}
	</main>
</div>
