<script lang="ts">
	import api from '$lib/api';
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import { element } from 'three/tsl';
	import DawnFileRenderer from './DawnFileRenderer.svelte';
	import PlotRenderer from './PlotRenderer.svelte';
	const jobId = page.params.job_id;
	let job: any | Error | null = null;
	let jobOutput = '';
	let jobOutputContainer: HTMLPreElement;
	let jobGeometry: string | null = null;
	let jobPlotData: any | null = null;

	$: {
		if (jobOutput && jobOutputContainer) {
			if (jobOutput.includes('Geometry rendered successfully')) {
				getGeometry();
			}
			if (jobOutput.includes('Job completed successfully')) {
				getPlots();
				getJob();
			}
			jobOutputContainer.scrollTop = jobOutputContainer.scrollHeight;
		}
	}

	async function getGeometry() {
		if (jobGeometry) {
			return;
		}
		jobGeometry = (await api.get(`/output/${jobId}/geometry.prim`)).data;
	}

	async function getPlots() {
		if (jobPlotData) {
			return;
		}
		const plotFiles = [
			'event_positions.csv',
			'fission_secondary_distribution.csv',
			'material_event_counts.csv',
			'neutron_energies.csv',
			'simulation_summary.csv'
		];
		let data: Record<string, string> = {};
		for (const file of plotFiles) {
			try {
				const res = await api.get(`/output/${jobId}/${file}`);
				data[file] = res.data;
			} catch (err) {
				console.error(`Error fetching plot data for ${file}:`, err);
				continue;
			}
		}
		jobPlotData = data;
	}
	const dataxyz = {
		x: [1, 2, 3, 4, 5],
		y: [1, 2, 4, 8, 16]
	};

	async function getJob() {
		try {
			const res = await api.get(`/jobs/${jobId}`);
			job = res.data.job;
			jobOutput = (job.job_output || '').trim();
			if (job.completed_at) {
				job.completed_at = new Date(job.completed_at + 'Z').toLocaleString();
				return; // No need to stream if the job is already completed
			}
			// Start streaming
			const jobOutputStream = await api.get(`/jobs/${jobId}/stream`, {
				adapter: 'fetch',
				responseType: 'stream'
			});
			jobOutputStream.data.pipeTo(
				new WritableStream({
					write(chunk) {
						const decoder = new TextDecoder();
						jobOutput += decoder.decode(chunk);
					}
				})
			);
		} catch (err) {
			job = err;
		}
	}

	onMount(getJob);
</script>

<span class="mb-4 text-2xl">Job #{jobId}</span>

<section class="flex w-full flex-row justify-between gap-3">
	<div class="flex flex-1/3 flex-col">
		<span class="mb-2 border-b-2 border-gray-300 pb-1 text-xl shadow-sm">Output</span>
		{#if job instanceof Error}
			<span>Error fetching job: {job.message}</span>
		{:else if job === null}
			<div class="text-center">
				<span class="loading loading-spinner loading-md"></span>
			</div>
		{:else}
			<pre
				class="max-w-xl overflow-y-auto rounded-lg p-4 font-mono text-sm"
				style="max-height: 600px;"
				bind:this={jobOutputContainer}>{jobOutput}
			</pre>
			{#if job.completed_at}
				<p class="flex items-center gap-2 text-sm text-green-300">
					Job completed at {job.completed_at}
					<button
						class="btn btn-sm btn-secondary flex items-center"
						on:click={() => {
							const blob = new Blob([jobOutput], { type: 'text/plain' });
							const url = URL.createObjectURL(blob);
							const a = document.createElement('a');
							a.href = url;
							a.download = `job_${jobId}_output.txt`;
							document.body.appendChild(a);
							a.click();
							document.body.removeChild(a);
							URL.revokeObjectURL(url);
						}}
						aria-label="Download job output"
						disabled={!jobOutput}
						><i class="fa-solid fa-download"></i>
					</button>
				</p>
			{/if}
		{/if}
	</div>
	<div class="flex flex-1/3 flex-col">
		<span class="mb-2 border-b-2 border-gray-300 pb-1 text-xl shadow-sm">Geometry</span>
		{#if jobGeometry}
			<DawnFileRenderer primText={jobGeometry} />
		{:else}
			<div class="text-center">
				<span class="loading loading-spinner loading-md"></span>
			</div>
		{/if}
	</div>
	<div class="flex flex-1/3 flex-col">
		<span class="mb-2 border-b-2 border-gray-300 pb-1 text-xl shadow-sm">Plots</span>
		{#if jobPlotData}
			<PlotRenderer plotData={jobPlotData} />
		{:else}
			<span class="text-sm text-gray-500">
				<i class="fa-solid fa-circle-info"></i>
				Plots will be available after the job is completed.
			</span>
		{/if}
	</div>
</section>
