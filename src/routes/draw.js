import { create_logger } from "./logger.js";

const logger = create_logger()

export function draw_shape(ctx, width, height, x, y, moves) {
	logger.log("draw_shape");
	if (moves.length < 1) return;
	ctx.beginPath();
	let move = moves[0];
	ctx.moveTo(x + move[0] * width, y + move[1] * height);
	for (let i = 1; i < moves.length; i++) {
		move = moves[i];
		ctx.lineTo(x + move[0] * width, y + move[1] * height);
	}
	ctx.closePath();
}

export const black_key_shapes = {
	B: [[-0.2, 0], [-0.2, 0.65], [0.4, 0.65], [0.4, 0]],
	D: [[-0.4, 0], [-0.4, 0.65], [0.2, 0.65], [0.2, 0]],
	E: [[-0.2, 0], [-0.2, 0.65], [0.4, 0.65], [0.4, 0]],
	G: [[-0.4, 0], [-0.4, 0.65], [0.2, 0.65], [0.2, 0]],
	A: [[-0.3, 0], [-0.3, 0.65], [0.3, 0.65], [0.3, 0]]
}
black_key_shapes.Bb = black_key_shapes.B;
black_key_shapes.Db = black_key_shapes.D;
black_key_shapes.Eb = black_key_shapes.E;
black_key_shapes.Gb = black_key_shapes.G;
black_key_shapes.Ab = black_key_shapes.A;

export function draw_black_key(ctx, shape, x, y, width, height, options) {
	logger.log("draw_black_key");
	if (!shape in black_key_shapes) throw "Invalid shape!"
	ctx.fillStyle = options?.fillStyle ?? 'black';
	ctx.strokeStyle = options?.strokeStyle ?? 'black';

	draw_shape(ctx, width, height, x, y, black_key_shapes[shape])

	ctx.fill();
	ctx.stroke();
	if (options?.text) {
		let base = Math.min(width, height);
		ctx.font = options?.font ?? `bold ${base / 4}px sans-serif`;
		ctx.fillStyle = options?.textFillStyle ?? 'white';
		let text = typeof options.text === "boolean" ? shape + "b" : options.text;
		const measurements = ctx.measureText(text)
		ctx.fillText(text, x + black_key_shapes[shape][0][0] * width + (0.6 * width - measurements.width) / 2, y + 0.6 * height)
	}
}

export const white_key_shapes = {
	C: [[0, 0], [0, 1], [1, 1], [1, 0.65], [0.6, 0.65], [0.6, 0]],
	C0: [[0, 0], [0, 1], [1, 1], [1, 0.65], [0.6, 0.65], [0.6, 0]],
	C1: [[0, 0], [0, 1], [1, 1], [1, 0]],
	D: [[0, 1], [1, 1], [1, 0.65], [0.8, 0.65], [0.8, 0], [0.2, 0], [0.2, 0.65], [0, 0.65]],
	D0: [[0, 1], [1, 1], [1, 0.65], [0.8, 0.65], [0.8, 0], [0, 0]],
	D1: [[0, 1], [1, 1], [1, 0], [0.2, 0], [0.2, 0.65], [0, 0.65]],
	E: [[0, 1], [1, 1], [1, 0], [0.4, 0], [0.4, 0.65], [0, 0.65]],
	E1: [[0, 1], [1, 1], [1, 0], [0.4, 0], [0.4, 0.65], [0, 0.65]],
	E0: [[0, 0], [0, 1], [1, 1], [1, 0]],
	F: [[0, 0], [0, 1], [1, 1], [1, 0.65], [0.6, 0.65], [0.6, 0]],
	F0: [[0, 0], [0, 1], [1, 1], [1, 0.65], [0.6, 0.65], [0.6, 0]],
	F1: [[0, 0], [0, 1], [1, 1], [1, 0]],
	G: [[0, 1], [1, 1], [1, 0.65], [0.7, 0.65], [0.7, 0], [0.2, 0], [0.2, 0.65], [0, 0.65]],
	G0: [[0, 1], [1, 1], [1, 0.65], [0.7, 0.65], [0.7, 0], [0, 0]],
	G1: [[0, 1], [1, 1], [1, 0], [0.2, 0], [0.2, 0.65], [0, 0.65]],
	A0: [[0, 0], [0, 1], [1, 1], [1, 0.65], [0.8, 0.65], [0.8, 0]],
	A: [[0, 1], [1, 1], [1, 0.65], [0.8, 0.65], [0.8, 0], [0.3, 0], [0.3, 0.65], [0, 0.65]],
	A1: [[0, 1], [1, 1], [1, 0], [0.3, 0], [0.3, 0.65], [0, 0.65]],
	B: [[0, 1], [1, 1], [1, 0], [0.4, 0], [0.4, 0.65], [0, 0.65]],
	B1: [[0, 1], [1, 1], [1, 0], [0.4, 0], [0.4, 0.65], [0, 0.65]],
	B0: [[0, 0], [0, 1], [1, 1], [1, 0]]
}

export function draw_white_key(ctx, shape, x, y, width, height, options) {
	logger.log("draw_white_key");
	logger.log(JSON.stringify({ ctx, shape, x, y, width, height, options }))
	if (!shape in white_key_shapes) throw "Invalid shape!"
	ctx.fillStyle = options?.fillStyle ?? 'white';
	ctx.strokeStyle = options?.strokeStyle ?? 'black';

	draw_shape(ctx, width, height, x, y, white_key_shapes[shape]);

	ctx.fill();
	if (options?.lineWidth) {
		ctx.lineWidth = options.lineWidth;
		ctx.stroke();
	}
	if (options?.text) {
		let base = Math.min(width, height);
		ctx.font = options?.font ?? `${base / 3}px sans-serif`;
		ctx.fillStyle = options?.textFillStyle ?? 'black';
		let text = typeof options.text === "boolean" ? shape : options.text
		const measurements = ctx.measureText(text)
		ctx.fillText(text, x + (width - measurements.width) / 2, y + height - 0.05 * height)
	}
}