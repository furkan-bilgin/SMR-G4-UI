<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { Layout, Data, Config } from 'plotly.js';

	export let data: {
		x: number[];
		y: number[];
		z: number[];
		colorValue?: (number | string)[];
	} = {
		x: [1, 2, 3, 4, 5, 6, 7, 8],
		y: [2, 3, 4, 5, 6, 7, 8, 9],
		z: [3, 4, 5, 6, 7, 8, 9, 10],
		colorValue: [10, 20, 30, 40, 50, 'red', 'green', 'blue']
	};

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

	function getPlotlyData(): Data[] {
		return [
			{
				x: data.x,
				y: data.y,
				z: data.z,
				mode: 'markers',
				type: 'scatter3d',
				marker: {
					size: markerSize,
					opacity: markerOpacity,
					color: data.colorValue,
					colorscale: typeof markerColorScale === 'string' ? markerColorScale : undefined
				},
				name: 'Data Points',
				showlegend: false
			}
		];
	}

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
			}
		};
	}

	function getPlotlyConfig(): Partial<Config> {
		return {
			responsive: true
		};
	}

	onMount(async () => {
		try {
			Plotly = await import('plotly.js-dist-min');
			isLoading = false;

			await Plotly.newPlot(plotDiv, getPlotlyData(), getLayout(), getPlotlyConfig()).then(
				(instance) => {
					plotlyInstance = instance;
				}
			);
		} catch (error) {
			console.error('Error loading or creating Plotly plot:', error);
			isLoading = false;
		}
	});

	$: if (plotlyInstance && Plotly) {
		try {
			Plotly.react(plotDiv, getPlotlyData(), getLayout(), getPlotlyConfig());
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
	{:else if !data || data.x.length === 0}
		<p class="text-gray-600">No data available to plot.</p>
	{/if}
</div>
