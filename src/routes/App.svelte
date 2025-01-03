<script>
	import * as Tone from "tone";
	import { onMount } from "svelte";
	import { SvelteMap } from "svelte/reactivity";
	import {
		number_to_note,
		note_to_number,
		number_is_natural,
		number_is_flat_or_sharp,
		number_to_letter,
		white_keys_up_to,
		white_key_index,
		white_key_index_to_letter,
		white_key_index_to_note_index,
		shift,
	} from "./note_helpers.js";
	import {
		draw_black_key,
		draw_white_key,
		black_key_shapes,
		white_key_shapes,
	} from "./draw.js";
	import { point_inside_polygon } from "./math.js";
	import { create_sampler } from "./piano.js";
	import { create_logger } from "./logger.js";

	const logger = create_logger();
	logger.on = true;

	let play, stop;

	let octave_shift = $state(0);
	let show_text = $state(false);
	let sustain = $state(true);
	let mark_middle_c = $state(true);
	let dark_keys = $state(true);
	let rows = $state(1);
	let n_low = $state(note_to_number("C2"));
	let n_low_white = $derived(
		n_low - (number_is_flat_or_sharp(n_low) ? 1 : 0),
	);
	let n_high = $state(note_to_number("C6"));
	let n_high_white = $derived(
		n_high + (number_is_flat_or_sharp(n_high) ? 1 : 0),
	);

	let number_of_white_keys = $derived(
		white_keys_up_to(n_high_white) - white_keys_up_to(n_low_white) + 1,
	);
	let white_keys_per_row = $derived(Math.ceil(number_of_white_keys / rows));

	let canvas = $state();

	let status = $state("");
	let playing_notes = $state(new SvelteMap());
	let hand_held = $state();

	function onpointerup(event) {
		if (event.target === canvas) event.preventDefault();
		const playing_note = playing_notes.get(event.pointerId);
		playing_notes.delete(event.pointerId);
		if (!sustain) stop(playing_note);
	}

	function get_note(rect, x, y) {
		if (x > (rect.width | 0) || y > (rect.height | 0)) return "";
		const key_width = rect.width / white_keys_per_row;
		const key_height = rect.height / rows;
		const clicked_col = (x / key_width) | 0;
		const clicked_row = (y / key_height) | 0;
		const internal_x = (x - clicked_col * key_width) / key_width;
		const internal_y = (y - clicked_row * key_height) / key_height;
		const clicked_pos = clicked_row * white_keys_per_row + clicked_col;
		const white_key_offset = white_key_index(number_to_letter(n_low_white));
		const note_offset = white_key_index_to_note_index(white_key_offset);
		const octaves = ((clicked_pos + white_key_offset) / 7) | 0;
		const clicked_note_index =
			n_low_white -
			note_offset +
			octaves * 12 +
			white_key_index_to_note_index((clicked_pos + white_key_offset) % 7);
		const clicked_note = number_to_note(clicked_note_index);
		let note_name = clicked_note[0];
		let shape_name = note_name;
		if (clicked_note_index === n_low_white) shape_name += "0";
		if (clicked_note_index === n_high_white) shape_name += "1";
		const polygon = white_key_shapes[shape_name];
		let hit = point_inside_polygon(
			[internal_x, internal_y],
			white_key_shapes[shape_name],
		);
		let hit_note = "";
		status = clicked_note;
		if (hit) {
			// clean hit
			return clicked_note;
		} else {
			if (note_name.match(/^[DEGAB]$/)) {
				hit = point_inside_polygon(
					[internal_x, internal_y],
					black_key_shapes[note_name],
				);
				if (hit) {
					return number_to_note(clicked_note_index - 1);
				}
			}
			if (!hit && note_name.match(/^[CDFGA]$/)) {
				let next_index = (white_key_index(note_name) + 1) % 7;
				let next_note = white_key_index_to_letter(next_index);
				hit = point_inside_polygon(
					[internal_x, internal_y],
					black_key_shapes[next_note].map(([x, y]) => [x + 1, y]),
				);
				if (hit) {
					return number_to_note(clicked_note_index + 1);
				}
			}
		}

		return "";
	}

	let onpointerdownonce = async () => {
		try {
			await Tone.start();
		} catch {}
		onpointerdownonce = undefined;
	};

	async function onpointerdown(event) {
		if (event.target === canvas) event.preventDefault();
		else return;

		if (onpointerdownonce) {
			await onpointerdownonce();
		}
		const rect = canvas.getBoundingClientRect();
		const x = event.clientX - rect.left;
		const y = event.clientY - rect.top;
		let current_note = get_note(rect, x, y);
		if (sustain) {
			if (playing_notes.get(event.pointerId) === current_note) {
				playing_notes.set(event.pointerId, "");
			} else {
				playing_notes.set(event.pointerId, current_note);
				play(shift(current_note, octave_shift));
			}
		} else {
			playing_notes.set(event.pointerId, current_note);
			play(shift(current_note, octave_shift));
		}
	}

	function onpointermove(event) {
		if (event.target === canvas) event.preventDefault();
		if (!playing_notes.get(event.pointerId)) return;
		const rect = canvas.getBoundingClientRect();
		const x = event.clientX - rect.left;
		const y = event.clientY - rect.top;

		let current_note = get_note(rect, x, y);
		if (
			current_note &&
			current_note !== playing_notes.get(event.pointerId)
		) {
			playing_notes.set(event.pointerId, current_note);
			play(shift(current_note, octave_shift));
		}
	}

	onMount(() => {
		hand_held = "ontouchstart" in window || navigator.maxTouchPoints > 0;

		function cancel_all_animation_frames() {
			let id = window.requestAnimationFrame(function () {});
			while (id--) window.cancelAnimationFrame(id);
		}
		cancel_all_animation_frames();
		({ play, stop } = create_sampler(Tone));
		const ctx = canvas.getContext("2d");
		ctx.imageSmoothingEnabled = true;
		let frame;

		function draw() {
			ctx.clearRect(0, 0, canvas.width, canvas.height);

			let key_width = canvas.width / white_keys_per_row;
			let y = 0;
			let k = n_low_white;
			for (let r = 0; r < rows; r++) {
				let x = 0;
				logger.log({ r, x });
				for (
					let i = 0, w = 0;
					w < white_keys_per_row && k <= n_high_white;
					i++
				) {
					logger.log({ i, k });
					if (number_is_natural(k)) {
						logger.log("Natural");
						w++;
						let letter = number_to_letter(k);
						let note = number_to_note(k);
						if (
							r > 0 &&
							i === 0 &&
							number_is_flat_or_sharp(k - 1)
						) {
							let letter = number_to_letter(k - 1);
							let note = number_to_note(k - 1);
							draw_black_key(
								ctx,
								letter,
								x,
								y,
								key_width,
								canvas.height / rows,
								{ text: show_text ? note : "" },
							);
							playing_notes.values().forEach((value) => {
								if (value !== note) return;
								draw_black_key(
									ctx,
									letter,
									x,
									y,
									key_width,
									canvas.height / rows,
									{ fillStyle: "rgba(255,255,255,0.2)" },
								);
							});
						}
						if (k === n_low_white) letter += "0";
						else if (k === n_high_white) letter += "1";
						draw_white_key(
							ctx,
							letter,
							x,
							y,
							key_width,
							canvas.height / rows,
							{
								text: show_text ? note : "",
								lineWidth: key_width / 12,
								fillStyle: dark_keys ? "#555" : "white",
							},
						);
						if (mark_middle_c && note === "C4") {
							draw_white_key(
								ctx,
								letter,
								x,
								y,
								key_width,
								canvas.height / rows,
								{ fillStyle: "rgba(0, 0, 0, 20%)" },
							);
						}
						playing_notes.values().forEach((value) => {
							if (value !== note) return;
							draw_white_key(
								ctx,
								letter,
								x,
								y,
								key_width,
								canvas.height / rows,
								{ fillStyle: "rgba(0, 0, 0, 10%)" },
							);
						});
						x += key_width;
						k++;
						if (k < n_high_white && number_is_flat_or_sharp(k)) {
							let letter = number_to_letter(k);
							let note = number_to_note(k);
							draw_black_key(
								ctx,
								letter,
								x,
								y,
								key_width,
								canvas.height / rows,
								{ text: show_text ? note : "" },
							);
							playing_notes.values().forEach((value) => {
								if (value !== note) return;
								draw_black_key(
									ctx,
									letter,
									x,
									y,
									key_width,
									canvas.height / rows,
									{ fillStyle: "rgba(255,255,255,0.2)" },
								);
							});
							k++;
						}
					}
				}
				y += canvas.height / rows;
			}
			logger.off();
			frame = requestAnimationFrame(draw);
		}
		draw();

		return () => {
			cancelAnimationFrame(frame);
		};
	});
</script>

<svelte:window {onpointerdown} {onpointerup} {onpointermove} />

<div class="screen">
	<div class="canvas-container">
		<canvas
			bind:this={canvas}
			width={(number_of_white_keys * 23 * 4) / rows}
			height={rows * 150 * 4}
			style:background-color="transparent"
		></canvas>
	</div>
	<div
		class="controls row"
		style:padding-bottom={hand_held ? "1em" : undefined}
	>
		<div class="col">
			<span style:font-size="small" style:text-align="center">Keys</span>
			<div class="row">
				<button
					onclick={() => (
						(n_low = note_to_number("A0")),
						(n_high = note_to_number("C8"))
					)}>88</button
				>
				<button
					onclick={() => (
						(n_low = note_to_number("E1")),
						(n_high = note_to_number("G7"))
					)}>76</button
				>
				<button
					onclick={() => (
						(n_low = note_to_number("C2")),
						(n_high = note_to_number("C7"))
					)}>61</button
				>
				<button
					onclick={() => (
						(n_low = note_to_number("C2")),
						(n_high = note_to_number("C6"))
					)}>49</button
				>
				<button
					onclick={() => (
						(n_low = note_to_number("F3")),
						(n_high = note_to_number("F6"))
					)}>37</button
				>
				<button
					onclick={() => (
						(n_low = note_to_number("C3")),
						(n_high = note_to_number("C5"))
					)}>25</button
				>
			</div>
		</div>

		<div class="col">
			<span style:font-size="small" style:text-align="center">Rows</span>
			<div class="row">
				<button onclick={() => (rows = 1)}>1</button>
				<button onclick={() => (rows = 2)}>2</button>
				<button onclick={() => (rows = 3)}>3</button>
				<button onclick={() => (rows = 4)}>4</button>
			</div>
		</div>

		<div class="col">
			<span style:font-size="small" style:text-align="center"
				>Octave{octave_shift ? ` ${octave_shift}` : ""}</span
			>
			<div class="row">
				<button onclick={() => octave_shift--}>-</button>
				<button onclick={() => octave_shift++}>+</button>
			</div>
		</div>

		<div class="col">
			<div class="row">
				<input
					type="range"
					min="0"
					max={n_high_white - 1}
					bind:value={n_low}
				/>
				<span>{number_to_note(n_low_white)}</span>
			</div>
			<div class="row">
				<input
					type="range"
					min={n_low + 1}
					max="87"
					bind:value={n_high}
				/>
				<span>{number_to_note(n_high_white)}</span>
			</div>
		</div>

		<label>
			<input type="checkbox" bind:checked={sustain} />
			<span>Sustain</span>
		</label>

		<label>
			<input type="checkbox" bind:checked={show_text} />
			<span>Text</span>
		</label>

		<label>
			<input type="checkbox" bind:checked={mark_middle_c} />
			<span>Mark Middle C</span>
		</label>

		<label>
			<input type="checkbox" bind:checked={dark_keys} />
			<span>Dark</span>
		</label>

		{#if status}
			<span>{status}</span>
		{/if}
	</div>
</div>

<style>
	:global(html, body) {
		margin: 0;
		padding: 0;
		background: #333;
		user-select: none;
		overflow: hidden;
		height: 100%;
		width: 100%;
		box-sizing: border-box;
		white-space: nowrap;
	}
	div.controls {
		color: #eee;
		background-color: #444;
		padding: 0.2em 0.5em;
		align-items: center;
		gap: 1em;
		max-height: 100%;
		max-width: 100%;
		width: 100%;
		overflow: auto;
	}
	div.col {
		display: flex;
		flex-direction: column;
	}
	div.row {
		display: flex;
	}
	div.screen {
		display: grid;
		grid-template-rows: 1fr auto;
		height: 100%;
		width: 100%;
		overflow: hidden;
	}
	div.canvas-container {
		display: flex;
		align-items: center;
		justify-content: center;
		max-height: 100%;
		max-width: 100%;
		width: 100%;
		overflow: hidden;
	}
	canvas {
		display: block;
		width: 100%;
		max-height: 100%;
		max-width: 100%;
		flex: 1;
		min-width: 0;
		touch-action: none;
	}
	button {
		background-color: #222;
		/* background-color: red; */
		color: white;
		font-size: small;
	}
	label {
		background-color: #222;
		display: flex;
		align-items: center;
		gap: 0.25em;
		padding: 0.2em 0.5em;
	}
</style>
