<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import Plotly from '$lib/Plotly.svelte';
	import type { Data } from 'plotly.js-dist-min';

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
		{ file: 'event_positions.csv', title: 'Event Positions' },
		{ file: 'neutron_energies.csv', title: 'Neutron Energies' },
		{ file: 'material_event_counts.csv', title: 'Material Event Counts' },
		{ file: 'fission_secondary_distribution.csv', title: 'Fission Secondary Distribution' },
		{ file: 'simulation_summary.csv', title: 'Simulation Summary' }
	];

	const plotFileTitles: Record<string, string> = {
		...plotFiles.reduce(
			(acc, { file, title }) => {
				acc[file] = title;
				return acc;
			},
			{} as Record<string, string>
		),
		'event_positions.csv': 'Event Positions',
		'event_positions_xy.csv': 'Event Positions XY',
		'event_positions_xz.csv': 'Event Positions XZ'
	};

	let parsedData: Record<string, any> = {};
	let parsedPlotData: Record<string, Data[]> = {};

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

	async function preparePlotlyData() {
		const eventPositionsData = parsedData['event_positions.csv'];
		const fissionData = parsedData['fission_secondary_distribution.csv'];
		const neutronEnergiesData = parsedData['neutron_energies.csv'];
		if (eventPositionsData && eventPositionsData.length > 0) {
			const eventGroup: Record<string, any> = {};
			eventPositionsData.forEach((d: any) => {
				if (!eventGroup[d.type]) {
					eventGroup[d.type] = [];
				}
				eventGroup[d.type].push(d);
			});
			const data: Data[] = [];
			const xyData: Data[] = [];
			const xzData: Data[] = [];
			for (const [type, points] of Object.entries(eventGroup)) {
				const x = points.map((d: any) => parseFloat(d.x_cm));
				const y = points.map((d: any) => parseFloat(d.y_cm));
				const z = points.map((d: any) => parseFloat(d.z_cm));
				const colorValue = points.map((d: any) => (d.type === 'CAPTURE' ? 'blue' : 'red'));
				data.push({
					x,
					y,
					z,
					mode: 'markers',
					type: 'scatter3d',
					marker: {
						size: 3,
						opacity: 0.8,
						color: colorValue,
						colorscale: 'Viridis'
					},
					name: type,
					showlegend: true
				});
				if (points.length > 0) {
					xyData.push({
						x,
						y,
						mode: 'markers',
						type: 'scatter',
						marker: { size: 3, color: colorValue },
						name: type
					});
					xzData.push({
						x,
						z,
						mode: 'markers',
						type: 'scatter',
						marker: { size: 3, color: colorValue },
						name: type
					});
				}
			}
			parsedPlotData['event_positions.csv'] = data;
			parsedPlotData['event_positions_xy.csv'] = xyData;
			parsedPlotData['event_positions_xz.csv'] = xzData;
		}
		if (fissionData && fissionData.length > 0) {
			parsedPlotData['fission_secondary_distribution.csv'] = [
				{
					x: fissionData.map((d: any) => parseFloat(d.secondary_count)),
					type: 'histogram'
				}
			];
		}
		if (neutronEnergiesData && neutronEnergiesData.length > 0) {
			parsedPlotData['neutron_energies.csv'] = [
				{
					x: neutronEnergiesData.map((d: any) => parseFloat(d.energy_MeV)),
					type: 'histogram'
				}
			];
		}
	}

	let gridElementWidth: number | null = null;
	let useFlex = false;

	$: useFlex = gridElementWidth ? gridElementWidth < 500 : false;
</script>

{#if !plotData}
	<div class="text-center">
		<span class="loading loading-spinner loading-md"></span>
	</div>
{:else}
	<div
		class="{useFlex ? 'flex flex-col' : 'grid grid-cols-3'} gap-2"
		bind:clientWidth={gridElementWidth}
	>
		{#each Object.entries(parsedPlotData) as [file, data]}
			<div class="bg-base-200 rounded-lg border p-4">
				<h3 class="mb-2 font-semibold">{plotFileTitles[file]}</h3>
				{#if data && data.length > 0}
					<div class="pb-4">
						<Plotly {data} />
					</div>
				{:else}
					<p>No data available for this plot.</p>
				{/if}
			</div>
		{/each}
		{#each plotFiles as { file, title }}
			{#if !parsedPlotData[file]}
				<div class="bg-base-200 rounded-lg border p-4">
					<h3 class="mb-2 font-semibold">{title}</h3>
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
				</div>
			{/if}
		{/each}
	</div>
{/if}

<style>
	/* Optional: Add some basic styling for the plot container if needed */
	.h-96 {
		height: 400px; /* Tailwind's h-96 corresponds to 24rem which is 384px, adjusting slightly for better visibility */
	}
</style>
