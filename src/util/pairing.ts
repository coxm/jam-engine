/**
 * Cantor pairing function.
 *
 * @see http://en.wikipedia.org/wiki/Pairing_function#Cantor_pairing_function
 */
export const pair = (k1: number, k2: number): number => (
	(0.5 * (k1 + k2) * (k1 + k2 + 1) + k2) | 0
);


/**
 * Inverse to the Cantor pairing function.
 *
 * @see http://en.wikipedia.org/wiki/Pairing_function#Inverting_the_Cantor_pairing_function
 */
export const depair = (z: number): [number, number] => {
	const w = Math.floor(0.5 * (Math.sqrt(8 * z + 1) - 1));
	const t = 0.5 * (w * (w + 1));
	const y = Math.floor(z - t);
	const x = Math.floor(w - y);
	return [x, y];
}
