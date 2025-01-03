export function point_inside_polygon(point, polygon) {
  const [px, py] = point;
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];

    const intersect = yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi;

    if (intersect) inside = !inside;
  }

  return inside;
}

export function matches (num, positions, mask) {
	let remainder = num % positions;
	let ones = (1 << positions) - 1
	return (ones << (positions - 1 - remainder) & ones) & mask;
}