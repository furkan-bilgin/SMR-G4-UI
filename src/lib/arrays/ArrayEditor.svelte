<script lang="ts">
	import RecursiveArrayEditor from './RecursiveArrayEditor.svelte';

	export let data: Array<any> = []; // The top-level array to be edited
	let structureEditable = false;

	$: {
		console.log('Data changed:', !!data.length);

		// Disallow editing of 1-dimensional arrays
		structureEditable = data[0] && Array.isArray(data[0]);
		console.log('Structure editable:', structureEditable);
	}

	function capitalizeWords(str: string) {
		if (!str) return '';
		return str
			.split('_')
			.map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
			.join(' ');
	}

	function addItemToRootArray() {
		if (!data) {
			data = []; // Initialize the array if it's null or undefined
		}

		let newItem;
		if (data.length > 0) {
			const firstItem = data[0];
			if (Array.isArray(firstItem)) {
				if (firstItem.length > 0 && typeof firstItem[0] === 'number') {
					newItem = Array(firstItem.length).fill(0);
				} else {
					newItem = [];
				}
			} else if (typeof firstItem === 'number') {
				newItem = 0;
			} else if (typeof firstItem === 'string') {
				newItem = '';
			} else {
				newItem = null; // Fallback
			}
		} else {
			newItem = 0;
		}

		data.push(newItem);
		data = [...data];
	}

	function removeItemFromRootArray(index: number) {
		if (data.length === 1) {
			return;
		}
		data.splice(index, 1);
		data = [...data];
	}

	function handleRootChange() {
		data = [...data];
	}
</script>

<div class="rounded-lg font-sans text-gray-100">
	<div class="flex {structureEditable ? 'flex-col' : 'flex-row'} gap-3">
		{#each data as item, i (i)}
			<div class="flex items-center gap-2 rounded-md">
				<!-- Render each top-level item using the recursive component -->
				<RecursiveArrayEditor
					bind:value={data[i]}
					index={i}
					path={[i]}
					on:change={handleRootChange}
				/>
				{#if structureEditable}
					<button
						type="button"
						class=" h-8 w-8 rounded-full bg-red-600 text-white transition-colors duration-200 hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:outline-none"
						on:click={() => removeItemFromRootArray(i)}
						aria-label="Remove item"
					>
						<i class="fa-solid fa-times"></i>
					</button>
				{/if}
			</div>
		{/each}

		{#if structureEditable}
			<button
				type="button"
				class="rounded-full bg-blue-700 px-6 py-2 text-white shadow-md transition-all duration-200 hover:bg-blue-800 hover:shadow-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
				on:click={addItemToRootArray}
				aria-label="Add item"
			>
				<i class="fa-solid fa-plus"></i>
			</button>
		{/if}
	</div>
</div>
