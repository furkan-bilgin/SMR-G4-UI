<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { Layout, Data, Config } from 'plotly.js';

	export let data: Data[] = [
		{
			x: [1, 2, 3],
			y: [4, 5, 6],
			z: [7, 8, 9],
			mode: 'markers',
			type: 'scatter3d',
			marker: {
				size: 3,
				opacity: 0.8,
				color: ['red', 'green', 'blue'],
				colorscale: 'Viridis'
			},
			name: 'Data Points',
			showlegend: true
		}
	];

	export let title: string = 'Interactive 3D Scatter Plot';
	export let xAxisTitle: string = 'X-Axis';
	export let yAxisTitle: string = 'Y-Axis';
	export let zAxisTitle: string = 'Z-Axis';

	export let markerSize: number = 3;
	export let markerOpacity: number = 0.8;
	export let markerColorScale: string | string[] = 'Viridis';

	export let plotBackgroundColor: string = '#f8f8f8';

	let plotDiv: HTMLDivElement;
	let plotlyInstance: Plotly.PlotlyHTMLElement | null = null;
	let Plotly: typeof import('plotly.js-dist-min');
	let isLoading: boolean = true;

	function getLayout(): Partial<Layout> {
		return {
			title: {
				text: title,
				font: { size: 20 }
			},
			// Removed width and height from layout to allow chart to fit parent
			scene: {
				xaxis: { title: { text: xAxisTitle } },
				yaxis: { title: { text: yAxisTitle } },
				zaxis: { title: { text: zAxisTitle } },
				bgcolor: plotBackgroundColor,
				camera: {
					eye: { x: 1.8, y: 1.8, z: 1.8 }
				}
			},
			xaxis: { automargin: true },
			yaxis: { automargin: true },
			autosize: true,
			hovermode: 'closest',
			margin: {
				l: 0,
				r: 0,
				t: 0,
				b: 0
			},
			legend: {
				x: 1,
				xanchor: 'right',
				y: 1
			}
		};
	}

	function getPlotlyConfig(): Partial<Config> {
		return {
			responsive: true,
			displayModeBar: false,
			displaylogo: false
		};
	}

	onMount(async () => {
		try {
			Plotly = await import('plotly.js-dist-min');
			isLoading = false;

			await Plotly.newPlot(plotDiv, data, getLayout(), getPlotlyConfig()).then((instance) => {
				plotlyInstance = instance;
			});
		} catch (error) {
			console.error('Error loading or creating Plotly plot:', error);
			isLoading = false;
		}
	});

	$: if (plotlyInstance && Plotly) {
		try {
			Plotly.react(plotDiv, data, getLayout(), getPlotlyConfig());
		} catch (error) {
			console.error('Error updating Plotly plot:', error);
		}
	}

	onDestroy(() => {
		if (plotlyInstance && Plotly) {
			try {
				Plotly.purge(plotDiv);
			} catch (error) {
				console.error('Error purging Plotly plot:', error);
			}
		}
	});
</script>

<div bind:this={plotDiv} class="h-full w-full" style="min-height: 400px; overflow: hidden;">
	{#if isLoading}
		<p class="text-gray-600">Loading 3D Plot...</p>
	{:else if !data}
		<p class="text-gray-600">No data available to plot.</p>
	{/if}
</div>
