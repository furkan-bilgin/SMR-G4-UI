<script lang="ts">
	export let config = {
		core_shape: 'cylinder',
		core_height_cm: 250.0,
		core_radius_cm: 100.0,
		fuel_pins: {
			layout: 'square',
			rows: 5,
			cols: 5,
			pin_pitch_cm: 20.0,
			pin_radius_cm: 3.5,
			pin_height_cm: 50.0,
			fuel_material: 'UO2_enriched',
			control_rod_positions: [
				[0, 0],
				[1, 1],
				[2, 2],
				[3, 3]
			]
		},
		control_rods: {
			radius_cm: 3.5,
			height_cm: 50.0,
			z_offset_cm: 0.0,
			control_rod_material: 'B4C'
		},
		reflector: {
			enabled: false,
			material: 'G4_GRAPHITE',
			thickness_cm: 10.0
		},
		pressure_vessel: {
			enabled: false,
			material: 'G4_STAINLESS-STEEL',
			thickness_cm: 10.0
		}
	};

	function handleSubmit() {
		console.log('Configuration submitted:', config);
	}
</script>

<form class="max-w-2xl" on:submit|preventDefault={handleSubmit}>
	<!-- Core Section -->
	<section>
		<h2 class="mb-4 text-xl font-bold">Core</h2>
		<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
			<div>
				<label for="core-shape" class="mb-1 block font-medium">Shape</label>
				<select class="select select-bordered w-full" bind:value={config.core_shape}>
					<option value="cylinder">Cylinder</option>
				</select>
			</div>
			<div>
				<label for="core-height" class="mb-1 block font-medium">Height (cm)</label>
				<input
					type="number"
					class="input input-bordered w-full"
					bind:value={config.core_height_cm}
					min="0"
					step="any"
				/>
			</div>
			<div>
				<label for="core-radius" class="mb-1 block font-medium">Radius (cm)</label>
				<input
					type="number"
					class="input input-bordered w-full"
					bind:value={config.core_radius_cm}
					min="0"
					step="any"
				/>
			</div>
		</div>
	</section>

	<!-- Fuel Pins Section -->
	<section>
		<h2 class="mb-4 text-xl font-bold">Fuel Pins</h2>
		<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
			<div>
				<label class="mb-1 block font-medium" for="fuel-pins-layout">Layout</label>
				<select
					id="fuel-pins-layout"
					class="select select-bordered w-full"
					bind:value={config.fuel_pins.layout}
				>
					<option value="square">Square</option>
				</select>
			</div>
			<div>
				<label class="mb-1 block font-medium" for="fuel-pins-fuel-material">Fuel Material</label>
				<input
					id="fuel-pins-fuel-material"
					type="text"
					class="input input-bordered w-full"
					bind:value={config.fuel_pins.fuel_material}
				/>
			</div>
		</div>
		<div class="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
			<div>
				<label class="mb-1 block font-medium" for="fuel-pins-rows">Rows</label>
				<input
					id="fuel-pins-rows"
					type="number"
					class="input input-bordered w-full"
					bind:value={config.fuel_pins.rows}
					min="1"
				/>
			</div>
			<div>
				<label class="mb-1 block font-medium" for="fuel-pins-cols">Cols</label>
				<input
					id="fuel-pins-cols"
					type="number"
					class="input input-bordered w-full"
					bind:value={config.fuel_pins.cols}
					min="1"
				/>
			</div>
			<div>
				<label class="mb-1 block font-medium" for="fuel-pins-pin-pitch">Pin Pitch (cm)</label>
				<input
					id="fuel-pins-pin-pitch"
					type="number"
					class="input input-bordered w-full"
					bind:value={config.fuel_pins.pin_pitch_cm}
					min="0"
					step="any"
				/>
			</div>
			<div>
				<label class="mb-1 block font-medium" for="fuel-pins-pin-radius">Pin Radius (cm)</label>
				<input
					id="fuel-pins-pin-radius"
					type="number"
					class="input input-bordered w-full"
					bind:value={config.fuel_pins.pin_radius_cm}
					min="0"
					step="any"
				/>
			</div>
			<div>
				<label for="fuel-pins-pin-height" class="mb-1 block font-medium">Pin Height (cm)</label>
				<input
					id="fuel-pins-pin-height"
					type="number"
					class="input input-bordered w-full"
					bind:value={config.fuel_pins.pin_height_cm}
					min="0"
					step="any"
				/>
			</div>
		</div>
		<div class="mt-4">
			<label for="fuel-pins-control-rod-positions" class="mb-1 block font-medium"
				>Control Rod Positions</label
			>
			<div class="flex flex-wrap gap-2" id="fuel-pins-control-rod-positions">
				{#each config.fuel_pins.control_rod_positions as pos, i (i)}
					<div class="flex items-center gap-1">
						<input
							id="fuel-pins-control-rod-row-{i}"
							type="number"
							class="input input-bordered w-10"
							bind:value={config.fuel_pins.control_rod_positions[i][0]}
							min="0"
						/>
						<span>,</span>
						<input
							id="fuel-pins-control-rod-col-{i}"
							type="number"
							class="input input-bordered w-10"
							bind:value={config.fuel_pins.control_rod_positions[i][1]}
							min="0"
						/>
						<button
							type="button"
							class="btn btn-xs btn-error ml-1"
							on:click={() => {
								config.fuel_pins.control_rod_positions.splice(i, 1);
								config.fuel_pins.control_rod_positions = [
									...config.fuel_pins.control_rod_positions
								];
							}}>✕</button
						>
					</div>
				{/each}
				<div class="flex items-center">
					<button
						type="button"
						class="btn btn-xs btn-primary"
						on:click={() => {
							config.fuel_pins.control_rod_positions.push([0, 0]);
							config.fuel_pins.control_rod_positions = [...config.fuel_pins.control_rod_positions];
						}}>+ Add</button
					>
				</div>
			</div>
		</div>
	</section>

	<!-- Control Rods Section -->
	<section>
		<h2 class="mb-4 text-xl font-bold">Control Rods</h2>
		<div class="grid grid-cols-1 gap-4 md:grid-cols-4">
			<div>
				<label class="mb-1 block font-medium" for="control-rods-radius">Radius (cm)</label>
				<input
					id="control-rods-radius"
					type="number"
					class="input input-bordered w-full"
					bind:value={config.control_rods.radius_cm}
					min="0"
					step="any"
				/>
			</div>
			<div>
				<label class="mb-1 block font-medium" for="control-rods-height">Height (cm)</label>
				<input
					id="control-rods-height"
					type="number"
					class="input input-bordered w-full"
					bind:value={config.control_rods.height_cm}
					min="0"
					step="any"
				/>
			</div>
			<div>
				<label class="mb-1 block font-medium" for="control-rods-z-offset">Z Offset (cm)</label>
				<input
					id="control-rods-z-offset"
					type="number"
					class="input input-bordered w-full"
					bind:value={config.control_rods.z_offset_cm}
					step="any"
				/>
			</div>
			<div>
				<label class="mb-1 block font-medium" for="control-rods-material">Material</label>
				<input
					id="control-rods-material"
					type="text"
					class="input input-bordered w-full"
					bind:value={config.control_rods.control_rod_material}
				/>
			</div>
		</div>
	</section>

	<!-- Reflector Section -->
	<section>
		<h2 class="mb-4 text-xl font-bold">Reflector</h2>
		<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
			<div class="flex items-center gap-2">
				<input
					type="checkbox"
					class="checkbox checkbox-primary"
					bind:checked={config.reflector.enabled}
					id="reflector-enabled"
				/>
				<label for="reflector-enabled" class="font-medium">Enabled</label>
			</div>
			<div>
				<label class="mb-1 block font-medium" for="reflector-material">Material</label>
				<input
					id="reflector-material"
					type="text"
					class="input input-bordered w-full"
					bind:value={config.reflector.material}
				/>
			</div>
			<div>
				<label class="mb-1 block font-medium" for="reflector-thickness">Thickness (cm)</label>
				<input
					id="reflector-thickness"
					type="number"
					class="input input-bordered w-full"
					bind:value={config.reflector.thickness_cm}
					min="0"
					step="any"
				/>
			</div>
		</div>
	</section>

	<!-- Pressure Vessel Section -->
	<section>
		<h2 class="mb-4 text-xl font-bold">Pressure Vessel</h2>
		<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
			<div class="flex items-center gap-2">
				<input
					type="checkbox"
					class="checkbox checkbox-primary"
					bind:checked={config.pressure_vessel.enabled}
					id="pressure-vessel-enabled"
				/>
				<label for="pressure-vessel-enabled" class="font-medium">Enabled</label>
			</div>
			<div>
				<label class="mb-1 block font-medium" for="pressure-vessel-material">Material</label>
				<input
					id="pressure-vessel-material"
					type="text"
					class="input input-bordered w-full"
					bind:value={config.pressure_vessel.material}
				/>
			</div>
			<div>
				<label class="mb-1 block font-medium" for="pressure-vessel-thickness">Thickness (cm)</label>
				<input
					type="number"
					class="input input-bordered w-full"
					bind:value={config.pressure_vessel.thickness_cm}
					min="0"
					step="any"
				/>
			</div>
		</div>
	</section>

	<div class="pt-6">
		<button class="btn btn-primary w-full py-3 font-bold" type="submit"> Save Config </button>
	</div>
</form>
