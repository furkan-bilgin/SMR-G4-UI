<script lang="ts">
	import { dev } from '$app/environment';
	export let to: string;
	export let className: string = '';
	let href: string | undefined = undefined;
	$: href = '/SMR-G4/' + to.replace(/^\//, '');
</script>

<a {href} class={className || 'text-blue-500 underline '}>
	<slot />
</a>
