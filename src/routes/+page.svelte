<script lang="ts">
	import api from '$lib/api';
	import { onMount } from 'svelte';

	let jobs: any[] | null = null;
	async function fetchJobs() {
		try {
			const response = await api.get('/jobs');
			jobs = response.data.jobs;
		} catch (error) {
			console.error('Error fetching jobs:', error);
			jobs = null;
		}
	}
	onMount(async () => fetchJobs());

	async function deleteJob(jobId: string) {
		try {
			await api.delete(`/jobs/${jobId}`);
			await fetchJobs();
		} catch (err) {
			console.error('Error deleting job:', err);
		}
	}
</script>

<section class="w-3xl">
	<div class="flex flex-col">
		<div class="mb-2 flex flex-row items-center justify-between">
			<span class="text-2xl">Simulations</span>
			<a class="btn bg-primary" href="/config">+ Run New Simulation</a>
		</div>
		<table class="table table-auto">
			<thead>
				<tr>
					<th class="w-1/3">ID</th>
					<th>Run Date</th>
					<th>Status</th>
					<th>Actions</th>
				</tr>
			</thead>
			<tbody>
				{#if jobs === null}
					<tr class="text-center">
						<td colspan="4"> <span class="loading loading-spinner loading-md"></span></td>
					</tr>
				{:else if jobs.length === 0}
					<tr class="text-center">
						<td colspan="4">No simulations found</td>
					</tr>
				{:else}
					{#each jobs as job}
						<tr>
							<td>
								<a href={`/job/${job.id}`}>{job.id}</a>
							</td>
							<td>
								{new Date(job.created_at + 'Z').toLocaleString()}
							</td>
							<td>
								{#if job.is_processing}
									<span class="badge badge-info">Processing</span>
								{:else if job.completed_at}
									<span class="badge badge-success">Completed</span>
								{:else}
									<span class="badge badge-warning">Pending</span>
								{/if}
							</td>
							<td>
								<button class="btn btn-xs btn-error" on:click={() => deleteJob(job.id)}>
									<i class="fa-solid fa-trash"></i>
								</button>
							</td>
						</tr>
					{/each}
				{/if}
			</tbody>
		</table>
	</div>
</section>
