<script lang="ts">
	import { onMount } from 'svelte';
	import { writable } from 'svelte/store';
	import Plot from 'svelte-plotly.js'; // Import the Plot component

	export let plotData: Record<string, string> | null = null;

	// Helper to parse CSV to array of objects
	function parseCSV(csv: string) {
		const [headerLine, ...lines] = csv.trim().split('\n');
		const headers = headerLine.split(',');
		return lines.map((line) => {
			const values = line.split(',');
			return Object.fromEntries(headers.map((h, i) => [h.trim(), values[i]?.trim()]));
		});
	}

	// Plot files and titles
	const plotFiles = [
		{ file: 'event_positions.csv', title: 'Event Positions', plotType: '3dScatter' },
		{ file: 'fission_secondary_distribution.csv', title: 'Fission Secondary Distribution' },
		{ file: 'material_event_counts.csv', title: 'Material Event Counts' },
		{ file: 'neutron_energies.csv', title: 'Neutron Energies' },
		{ file: 'simulation_summary.csv', title: 'Simulation Summary' }
	];

	// Store for parsed data
	let parsedData: Record<string, any[]> = {};

	// Data, layout, and config for the Plotly plot
	let plotlyData: Plotly.Data[] = [];
	let plotlyLayout: Partial<Plotly.Layout> = {};
	let plotlyConfig: Partial<Plotly.Config> = { responsive: true };

	// Reactive block to parse data and prepare plot data when plotData changes
	$: if (plotData) {
		parsedData = {};
		for (const { file } of plotFiles) {
			if (plotData[file]) {
				parsedData[file] = parseCSV(plotData[file]);
			}
		}
		// Prepare Plotly data after parsing
		preparePlotlyData();
	}

	function preparePlotlyData() {
		const eventPositionsData = parsedData['event_positions.csv'];
		if (eventPositionsData && eventPositionsData.length > 0) {
			const x = eventPositionsData.map((d) => parseFloat(d.x_cm));
			const y = eventPositionsData.map((d) => parseFloat(d.y_cm));
			const z = eventPositionsData.map((d) => parseFloat(d.z_cm));
			plotlyData = [
				{
					x: x,
					y: y,
					z: z,
					mode: 'markers',
					marker: {
						size: 3,
						opacity: 0.8
					},
					type: 'scatter3d' // Specify 3D scatter plot type
				}
			];

			plotlyLayout = {
				title: 'Event Positions 3D Scatter Plot',
				scene: {
					xaxis: { title: 'X' },
					yaxis: { title: 'Y' },
					zaxis: { title: 'Z' }
				},
				margin: {
					l: 0,
					r: 0,
					b: 0,
					t: 40
				}
			};
		} else {
			// Clear plot data if no event positions data is available
			plotlyData = [];
			plotlyLayout = {};
		}
	}
</script>

{#if !plotData}
	<div class="text-center">
		<span class="loading loading-spinner loading-md"></span>
	</div>
{:else}
	<div class="flex flex-col gap-6">
		{#each plotFiles as { file, title, plotType }}
			<div class="bg-base-200 rounded-lg border p-4">
				<h3 class="mb-2 font-semibold">{title}</h3>
				{#if parsedData[file]?.length}
					{#if plotType === '3dScatter' && file === 'event_positions.csv'}
						<div class="h-96 w-full">
							<Plot
								data={plotlyData}
								layout={plotlyLayout}
								config={plotlyConfig}
								fillParent={true}
							/>
						</div>
					{:else}
						<div class="overflow-x-auto">
							<table class="table-zebra table-xs table">
								<thead>
									<tr>
										{#each Object.keys(parsedData[file][0]) as col}
											<th>{col}</th>
										{/each}
									</tr>
								</thead>
								<tbody>
									{#each parsedData[file] as row}
										<tr>
											{#each Object.values(row) as val}
												<td>{val}</td>
											{/each}
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					{/if}
				{:else}
					<span class="text-sm text-gray-400">No data available.</span>
				{/if}
			</div>
		{/each}
	</div>
{/if}

<style>
	/* Optional: Add some basic styling for the plot container if needed */
	.h-96 {
		height: 400px; /* Tailwind's h-96 corresponds to 24rem which is 384px, adjusting slightly for better visibility */
	}
</style>
