<script lang="ts">
	import api from '$lib/api';
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import { element } from 'three/tsl';
	const jobId = page.params.job_id;
	let job: any | Error | null = null;
	let jobOutput = '';
	let jobOutputContainer: HTMLPreElement;

	$: {
		if (jobOutput && jobOutputContainer) {
			jobOutputContainer.scrollTop = jobOutputContainer.scrollHeight;
		}
	}

	onMount(async () => {
		try {
			const res = await api.get(`/jobs/${jobId}`);
			job = res.data.job;
			jobOutput = job.job_output || '';
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

<section class="w-2xl">
	<div class="flex flex-col">
		<div class="mb-2 flex flex-row items-center justify-between">
			<span class="text-2xl">Job #{jobId} Output</span>
		</div>
		{#if job instanceof Error}
			<span>Error fetching job: {job.message}</span>
		{:else if job === null}
			<div class="text-center">
				<span class="loading loading-spinner loading-md"></span>
			</div>
		{:else}
			<pre
				class="max-w-xl overflow-y-auto rounded-lg p-4 font-mono text-sm"
				style="max-height: 800px;"
				bind:this={jobOutputContainer}>
        {jobOutput}
      </pre>
		{/if}
	</div>
</section>
