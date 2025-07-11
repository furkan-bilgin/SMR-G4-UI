<script lang="ts">
	import api from '$lib/api';
	import { onMount } from 'svelte';

	let jobs: any[] | null = null;
	onMount(async () => {
		jobs = await api
			.get('/jobs')
			.then((res) => res.data.jobs)
			.catch((err) => {
				console.error('Error fetching jobs:', err);
				return null;
			});
	});
</script>

<section class="w-2xl">
	<div class="flex flex-col">
		<div class="mb-2 flex flex-row items-center justify-between">
			<span class="text-2xl">Simulations</span>
			<a class="btn bg-primary" href="/config">+ Run New Simulation</a>
		</div>
		<table class="table table-auto">
			<thead>
				<tr>
					<th class="w-1/2">ID</th>
					<th>Status</th>
				</tr>
			</thead>
			<tbody>
				{#if jobs === null}
					<tr class="text-center">
						<td colspan="2"> <span class="loading loading-spinner loading-md"></span></td>
					</tr>
				{:else if jobs.length === 0}
					<tr class="text-center">
						<td colspan="2">No simulations found</td>
					</tr>
				{:else}
					{#each jobs as job}
						<tr>
							<td>
								<a href={`/job/${job.id}`}>{job.id}</a>
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
						</tr>
					{/each}
				{/if}
			</tbody>
		</table>
	</div>
</section>
