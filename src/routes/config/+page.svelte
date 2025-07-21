<script lang="ts">
	import api from '$lib/api';
	import ArrayEditor from '$lib/arrays/ArrayEditor.svelte';
	import { onMount } from 'svelte';

	export let config: Record<string, any> = {
		core_shape: 'cylinder',
		core_height_cm: 500.0,
		core_radius_cm: 250.0,

		fuel_pins: {
			layout: 'hexagonal',
			rows: 5,
			cols: 5,
			pin_pitch_cm: 20.0,
			pin_radius_cm: 3.5,
			pin_height_cm: 200.0,
			FuelPinCount: 16,
			fuel_material: 'UO2_enriched',

			control_rod_positions: [
				[0, 0],
				[1, 0],
				[-1, 0]
			]
		},

		control_rods: {
			radius_cm: 3.5,
			height_cm: 200.0,
			control_rod_material: 'B4C'
		},

		reflector: {
			enabled: false,
			material: 'G4_GRAPHITE',
			thickness_cm: 20.0
		},

		pressure_vessel: {
			enabled: false,
			material: 'G4_STAINLESS-STEEL',
			thickness_cm: 20.0
		},

		primary_particle: {
			type: 'neutron',
			energy_MeV: 0.000000025,
			position_cm: [0, 0, 300],
			direction: [0, 0, -1],
			random_direction: false
		}
	};
	config = { ...config, event_count: 1000 };
	let configTypes: any = {};
	onMount(() => {
		// Extract types from config
		function extractTypes(obj: any, typeObj: any) {
			for (const key in obj) {
				if (typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
					typeObj[key] = {};
					extractTypes(obj[key], typeObj[key]);
				} else {
					typeObj[key] = typeof obj[key];
				}
			}
		}
		extractTypes(config, configTypes);
	});

	function resolveTypes(obj: any, types: any) {
		for (const key in obj) {
			if (typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
				resolveTypes(obj[key], types[key]);
			} else if (typeof obj[key] !== types[key]) {
				if (types[key] === 'number') {
					obj[key] = parseFloat(obj[key]);
				} else if (types[key] === 'boolean') {
					obj[key] = obj[key] === 'true' || obj[key] === true;
				} else if (types[key] === 'string') {
					obj[key] = String(obj[key]);
				}
			}
		}
	}

	let isSubmitting = false;
	let availableMaterials: string[] = [
		'G4_WATER',
		'G4_Si',
		'G4_AIR',
		'G4_GRAPHITE',
		'G4_STAINLESS-STEEL',
		'G4_POLYETHYLENE',
		'G4_CONCRETE',
		'UO2_enriched',
		'B4C'
	];

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
		// Ensure that config has fields that are compatible
		resolveTypes(config, configTypes);
		isSubmitting = true;
		api.post('/schedule', { job_config: config }).then((res: any) => {
			window.location.href = `/SMR-G4/job/${res.data.job_id}`;
		});
	}

	// Helper function to capitalize words
	function capitalizeWords(str: string) {
		return str
			.replace(/_cm$/, ' (cm)')
			.replace(/_/g, ' ')
			.split(' ')
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
			.join(' ');
	}
</script>

<form class="w-3xl" on:submit|preventDefault={handleSubmit}>
	<section>
		<h2 class="mb-4 text-xl font-bold">Core Shape</h2>
		<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
			<div>
				<label for="core_shape" class="mb-1 block font-medium">Core Shape</label>
				<select
					class="select select-bordered w-full"
					bind:value={config.core_shape}
					id="core_shape"
				>
					<option value="cylinder">Cylinder</option>
					<option value="box">Box</option>
					<option value="sphere">Sphere</option>
				</select>
			</div>
			{#each [{ key: 'core_height_cm', label: 'Core Height (cm)' }, { key: 'core_radius_cm', label: 'Core Radius (cm)' }, { key: 'event_count', label: 'Event Count' }] as field}
				<div class="flex items-end">
					<div class="w-full">
						<label for={field.key} class="mb-1 block font-medium">{field.label}</label>
						<input
							type="number"
							class="input input-bordered w-full"
							id={field.key}
							bind:value={config[field.key]}
							min={field.key === 'event_count' ? 1 : undefined}
							step="any"
						/>
					</div>
				</div>
			{/each}
		</div>
	</section>
	<hr class="my-3" />

	{#each Object.entries(config) as [key, value]}
		{#if key !== 'core_shape' && typeof value === 'object' && !Array.isArray(value)}
			<section>
				<h2 class="mb-4 text-xl font-bold">
					{capitalizeWords(key)}
				</h2>
				<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
					{#each Object.entries(value) as [subKey, subValue]}
						{#if !Array.isArray(subValue)}
							{#if key === 'fuel_pins'}
								{#if subKey === 'layout'}
									<div>
										<label for="{key}-{subKey}" class="mb-1 block font-medium">
											{capitalizeWords(subKey)}
										</label>
										<select class="select select-bordered w-full" bind:value={value[subKey]}>
											<option value="square">Square</option>
											<option value="hexagonal">Hexagonal</option>
										</select>
									</div>
								{:else if value.layout === 'square' && ['rows', 'cols', 'pin_pitch_cm', 'pin_radius_cm', 'pin_height_cm', 'fuel_material'].includes(subKey)}
									<div>
										<label for="{key}-{subKey}" class="mb-1 block font-medium">
											{capitalizeWords(subKey)}
										</label>
										{#if subKey === 'fuel_material'}
											<select class="select select-bordered w-full" bind:value={value[subKey]}>
												{#each availableMaterials as material}
													<option value={material}>{material}</option>
												{/each}
											</select>
										{:else}
											<input
												type={getInputType(subValue)}
												class="input input-bordered w-full"
												id="{key}-{subKey}"
												bind:value={value[subKey]}
												step={getInputType(subValue) === 'number' ? 'any' : undefined}
											/>
										{/if}
									</div>
								{:else if value.layout === 'hexagonal' && ['pin_pitch_cm', 'pin_radius_cm', 'pin_height_cm', 'FuelPinCount', 'fuel_material'].includes(subKey)}
									<div>
										<label for="{key}-{subKey}" class="mb-1 block font-medium">
											{capitalizeWords(subKey)}
										</label>
										{#if subKey === 'fuel_material'}
											<select class="select select-bordered w-full" bind:value={value[subKey]}>
												{#each availableMaterials as material}
													<option value={material}>{material}</option>
												{/each}
											</select>
										{:else}
											<input
												type={getInputType(subValue)}
												class="input input-bordered w-full"
												id="{key}-{subKey}"
												bind:value={value[subKey]}
												step={getInputType(subValue) === 'number' ? 'any' : undefined}
											/>
										{/if}
									</div>
								{/if}
							{:else if (subKey === 'material' || subKey === 'control_rod_material') && availableMaterials.length > 0}
								<div>
									<label for="{key}-{subKey}" class="mb-1 block font-medium">
										{capitalizeWords(subKey)}
									</label>
									<select class="select select-bordered w-full" bind:value={value[subKey]}>
										{#each availableMaterials as material}
											<option value={material}>{material}</option>
										{/each}
									</select>
								</div>
							{:else if subKey !== 'layout'}
								<div>
									<label for="{key}-{subKey}" class="mb-1 block font-medium">
										{capitalizeWords(subKey)}
									</label>
									{#if getInputType(subValue) === 'checkbox'}
										<input
											type="checkbox"
											class="checkbox checkbox-primary"
											id="{key}-{subKey}"
											bind:checked={value[subKey]}
										/>
									{:else}
										<input
											type={getInputType(subValue)}
											class="input input-bordered w-full"
											id="{key}-{subKey}"
											bind:value={value[subKey]}
											step={getInputType(subValue) === 'number' ? 'any' : undefined}
										/>
									{/if}
								</div>
							{/if}
						{:else if Array.isArray(subValue)}
							<div>
								<!-- svelte-ignore a11y_label_has_associated_control -->
								<label class="mb-1 block font-medium">
									{capitalizeWords(subKey)}
								</label>
								<ArrayEditor bind:data={value[subKey]} />
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
