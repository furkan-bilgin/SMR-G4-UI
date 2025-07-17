<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	// `value` is the current item being edited (can be a primitive or another array)
	export let value: any;
	// `index` is the position of this item within its parent array, used for unique IDs
	export let index;
	// `path` tracks the nesting level for generating unique IDs and debugging
	export let path: any = [];

	const dispatch = createEventDispatcher();

	function capitalizeWords(str: string) {
		if (!str) return '';
		return str
			.split('_')
			.map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
			.join(' ');
	}

	function addItemToArray(arr: any[]) {
		if (!arr) return;

		let newItem;
		if (arr.length > 0) {
			const firstItem = arr[0];
			if (Array.isArray(firstItem)) {
				if (firstItem.length > 0 && typeof firstItem[0] === 'number') {
					newItem = Array(firstItem.length).fill(0); // e.g., for [[1,2]], adds [0,0]
				} else {
					newItem = []; // e.g., for [[],[]] or [[[1]]], adds []
				}
			} else if (typeof firstItem === 'number') {
				newItem = 0; // If array contains numbers, add a number
			} else if (typeof firstItem === 'string') {
				newItem = ''; // If array contains strings, add an empty string
			} else {
				newItem = null; // Fallback for other types
			}
		} else {
			newItem = 0;
		}

		arr.push(newItem);
		value = [...arr];
		dispatch('change', value);
	}

	function removeItemFromArray(arr: any[], idx: any) {
		arr.splice(idx, 1);
		value = [...arr];
		dispatch('change', value);
	}

	$: uniqueId = `array-editor-${path.join('-')}-${index}`;
</script>

<!-- Conditional rendering based on whether the current `value` is an array or a primitive -->
{#if Array.isArray(value)}
	<!-- If `value` is an array, render it as a container with its items -->
	<div class="flex flex-col gap-2 rounded-md shadow-sm">
		<div class="flex flex-wrap items-center gap-2">
			{#each value as item, i (i)}
				<div class="flex items-center gap-1">
					<svelte:self
						bind:value={value[i]}
						index={i}
						path={[...path, i]}
						on:change={(e) => {
							value = [...value];
							dispatch('change', value);
						}}
					/>
					{#if i < value.length - 1 && !Array.isArray(value[i])}
						<span class="text-gray-500">,</span>
					{/if}
				</div>
			{/each}
		</div>
	</div>
{:else if typeof value === 'number'}
	<input
		id={uniqueId}
		type="number"
		class="input input-bordered w-10 rounded-md border border-gray-700 bg-gray-900 px-2 py-1 text-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
		bind:value
		on:input={() => dispatch('change', value)}
	/>
{:else if typeof value === 'string'}
	<input
		id={uniqueId}
		type="text"
		class="input input-bordered w-16 rounded-md border border-gray-700 bg-gray-900 px-2 py-1 text-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
		bind:value
		on:input={() => dispatch('change', value)}
	/>
{:else}
	<span id={uniqueId} class="rounded-md border border-gray-700 bg-gray-900 p-2 text-gray-400">
		{JSON.stringify(value)}
	</span>
{/if}
