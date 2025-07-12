<script lang="ts">
	import api from '$lib/api';

	export let config: Record<string, any> = {
		core_shape: 'cylinder',
		core_height_cm: 300.0,
		core_radius_cm: 150.0,

		fuel_pins: {
			layout: 'square',
			rows: 5,
			cols: 5,
			pin_pitch_cm: 30.0,
			pin_radius_cm: 3.5,
			pin_height_cm: 50.0,
			fuel_material: 'UO2_enriched',
			control_rod_positions: [
				[0, 0],
				[1, 1],
				[2, 2],
				[3, 3],
				[4, 2],
				[3, 2]
			]
		},
		control_rods: {
			radius_cm: 10.5,
			height_cm: 50.0,
			z_offset_cm: 30.0,
			control_rod_material: 'B4C'
		},
		reflector: {
			enabled: true,
			material: 'G4_GRAPHITE',
			thickness_cm: 20.0
		},
		pressure_vessel: {
			enabled: true,
			material: 'G4_STAINLESS-STEEL',
			thickness_cm: 20.0
		},
		primary_particle: {
			type: 'neutron',
			energy_MeV: 0.025,
			position_cm: [0, 0, 0],
			random_direction: true,
			direction: [0, 0, 1]
		}
	};
	let isSubmitting = false;

	function getInputType(value: any) {
		if (typeof value === 'number') {
			return 'number';
		} else if (typeof value === 'boolean') {
			return 'checkbox';
		} else if (typeof value === 'string') {
			return 'text';
		}
		return 'text';
	}

	function handleSubmit() {
		isSubmitting = true;
		api.post('/schedule', { job_config: config }).then((res: any) => {
			window.location.href = `/job/${res.data.job_id}`;
		});
	}
</script>

<form class="w-3xl" on:submit|preventDefault={handleSubmit}>
	{#each Object.entries(config) as [key, value]}
		{#if typeof value === 'object' && !Array.isArray(value)}
			<section>
				<h2 class="mb-4 text-xl font-bold">
					{key
						.replace(/_/g, ' ')
						.split(' ')
						.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
						.join(' ')}
				</h2>
				<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
					{#each Object.entries(value) as [subKey, subValue]}
						{#if !Array.isArray(subValue)}
							<div>
								<label for="{key}-{subKey}" class="mb-1 block font-medium">
									{subKey
										.replace(/_cm$/, ' (cm)')
										.replace(/_/g, ' ')
										.split(' ')
										.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
										.join(' ')}
								</label>
								{#if getInputType(subValue) === 'checkbox'}
									<input
										type="checkbox"
										class="checkbox checkbox-primary"
										id="{key}-{subKey}"
										bind:checked={value[subKey]}
									/>
								{:else if subKey === 'layout' || subKey === 'core_shape'}
									<select class="select select-bordered w-full" bind:value={value[subKey]}>
										<option value={subValue}>
											{(subValue as string).charAt(0).toUpperCase() + (subValue as string).slice(1)}
										</option>
									</select>
								{:else}
									<input
										type={getInputType(subValue)}
										class="input input-bordered w-full"
										id="{key}-{subKey}"
										bind:value={value[subKey]}
										min={getInputType(subValue) === 'number' ? '0' : undefined}
										step={getInputType(subValue) === 'number' ? 'any' : undefined}
									/>
								{/if}
							</div>
						{:else if Array.isArray(subValue) && subKey === 'control_rod_positions'}
							<div class="mt-4">
								<label for="{key}-{subKey}" class="mb-1 block font-medium">
									{subKey
										.replace(/_/g, ' ')
										.split(' ')
										.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
										.join(' ')}
								</label>
								<div class="flex flex-wrap gap-2" id="{key}-{subKey}">
									{#each subValue as pos, i (i)}
										<div class="flex items-center gap-1">
											<input
												id="{key}-{subKey}-row-{i}"
												type="number"
												class="input input-bordered w-10"
												bind:value={pos[0]}
												min="0"
											/>
											<span>,</span>
											<input
												id="{key}-{subKey}-col-{i}"
												type="number"
												class="input input-bordered w-10"
												bind:value={pos[1]}
												min="0"
											/>
											<button
												type="button"
												class="btn btn-xs btn-error ml-1"
												on:click={() => {
													value[subKey].splice(i, 1);
													value[subKey] = [...value[subKey]];
												}}>✕</button
											>
										</div>
									{/each}
									<div class="flex items-center">
										<button
											type="button"
											class="btn btn-xs btn-primary"
											on:click={() => {
												value[subKey].push([0, 0]);
												value[subKey] = [...value[subKey]];
											}}>+ Add</button
										>
									</div>
								</div>
							</div>
						{/if}
					{/each}
				</div>
			</section>
			<hr class="my-3" />
		{/if}
	{/each}

	<div class="pt-3">
		<button class="btn btn-primary w-full py-3 font-bold" type="submit" disabled={isSubmitting}>
			{#if isSubmitting}
				<span class="loading loading-spinner loading-sm"></span>
			{/if}
			Schedule Simulation
		</button>
	</div>
</form>
