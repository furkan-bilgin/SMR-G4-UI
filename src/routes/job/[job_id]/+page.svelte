<script lang="ts">
	import api from '$lib/api';
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import { element } from 'three/tsl';
	import DawnFileRenderer from '$lib/DawnFileRenderer.svelte';
	const jobId = page.params.job_id;
	let job: any | Error | null = null;
	let jobOutput = '';
	let jobOutputContainer: HTMLPreElement;
	let jobGeometry: string | null = null;

	$: {
		if (jobOutput && jobOutputContainer) {
			jobOutputContainer.scrollTop = jobOutputContainer.scrollHeight;
		}
	}

	async function pollGeometry() {
		if (jobGeometry) {
			return;
		}
		let geometryData;
		try {
			geometryData = await api.get(`/output/${jobId}/geometry.prim`);
		} catch (err) {
			// Means the geometry file is not available yet
			return;
		}
		jobGeometry = geometryData.data;
		clearInterval(geometryPollInterval);
	}

	const geometryPollInterval = setInterval(pollGeometry, 1000);
	pollGeometry();

	onMount(async () => {
		try {
			const res = await api.get(`/jobs/${jobId}`);
			job = res.data.job;
			jobOutput = job.job_output || '';
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
	});
</script>

<span class="mb-4 text-2xl">Job #{jobId}</span>

<section class="flex w-full flex-row justify-between gap-3">
	<div class="flex flex-1/3 flex-col">
		<span class="mb-2 text-xl">Output</span>
		<div class="mb-2 flex flex-row items-center justify-between"></div>
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
				bind:this={jobOutputContainer}>
        {jobOutput}
				{#if job.completed_at}
					<p class="text-sm text-green-300">Job completed at {job.completed_at}</p>
				{/if}
      </pre>
		{/if}
	</div>
	<div class="flex flex-1/3 flex-col">
		<span class="mb-2 text-xl">Geometry</span>
		{#if jobGeometry}
			<DawnFileRenderer primText={jobGeometry} />
		{:else}
			<div class="text-center">
				<span class="loading loading-spinner loading-md"></span>
			</div>
		{/if}
	</div>
	<div class="flex flex-1/3 flex-col">
		<span class="mb-2 text-xl">Plots</span>
		<span class="text-sm text-gray-500">
			<i class="fa-solid fa-circle-info"></i>
			Plots will be available after the job is completed.
		</span>
	</div>
</section>
