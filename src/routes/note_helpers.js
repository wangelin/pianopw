import { matches } from "./math.js"

export function number_to_note(num, sharp) {
	if (num < 0) throw "Invalid argument";
	if (num > 87) throw "Invalid argument";

	let note;
	if (sharp) {
		note = "AABCCDDEFFGG"[num % 12];
		if (number_is_flat_or_sharp(num)) note += "#";
	} else {
		note = "ABBCDDEEFGGA"[num % 12];
		if (number_is_flat_or_sharp(num)) note += "b";
	}
	let octave = (num + 9) / 12 | 0;
	return note + octave;
}

function bit_count(num) {
	let count = 0;
	while (num) {
		num &= num - 1;
		count++;
	}
	return count;
}

export function white_keys_up_to(num) {
	const octaves = num / 12 | 0;
	const white_keys_in_octaves = octaves * 7;
	const white_keys_in_remainder = bit_count(matches(num, 12, 0b1011_0101_1010));

	return white_keys_in_octaves + white_keys_in_remainder;
}

export function number_to_letter(num) {
	return "ABBCDDEEFGGA"[num % 12];
}

export function white_key_index(letter) {
	return "CDEFGAB".indexOf(letter);
}

export function white_key_index_to_letter(index) {
	return "CDEFGAB"[index];
}

export function white_key_index_to_note_index(index) {
	return [3, 5, 7, 8, 10, 12, 14][index];
}

export function number_is_natural(num) {
	return (0b10110101101 & 1 << num % 12) > 0;
}

export function number_is_flat_or_sharp(num) {
	return (0b101001010010 & 1 << num % 12) > 0; // 2642
}

export function note_to_number(note) {
	let letter = note.slice(0, -1).toLowerCase();
	let octave = +note.at(-1);
	if (isNaN(octave)) throw "Invalid argument";
	let num = -1;
	switch (letter) {
		case "a":
			num = octave * 12 + 0;
			break;
		case "bb":
		case "a#":
			num = octave * 12 + 1;
			break;
		case "b":
			num = octave * 12 + 2;
			break;
		case "c":
			num = octave * 12 - 9;
			break;
		case "db":
		case "c#":
			num = octave * 12 - 8;
			break;
		case "d":
			num = octave * 12 - 7;
			break;
		case "eb":
		case "d#":
			num = octave * 12 - 6;
			break;
		case "e":
			num = octave * 12 - 5;
			break;
		case "f":
			num = octave * 12 - 4;
			break;
		case "gb":
		case "f#":
			num = octave * 12 - 3;
			break;
		case "g":
			num = octave * 12 - 2;
			break;
		case "ab":
		case "g#":
			num = octave * 12 - 1;
			break;
	}
	if (num < 0 || num > 87) throw "Invalid argument";
	return num;
}

export function shift(note, shift) {
	let letter = note.slice(0, -1);
	let octave = +note.at(-1) + shift;
	if (octave < 0) octave = 0;
	if (octave > 8) octave = 8;
	return `${letter}${octave}`
}