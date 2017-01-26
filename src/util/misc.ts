export const EPSILON: number = 1e-10;


export function noop(): void {
	/* tslint:enable:no-empty */
	/* tslint:disable:no-empty */
}


export function identity<T>(t: T): T {
	return t;
}


export function isReal(x: number): boolean {
	return x === +x && Math.abs(x) < Infinity;
}


export function isInt(x: number): boolean {
	return x === (x|0);
}


export function toInt(x: number): number {
	return x|0;
}


export function randInRange(min: number, max: number): number {
	return Math.random() * (max - min) + min;
}


export function randIntInRange(min: number, max: number): number {
	return toInt(randInRange(min, max));
}


export function clamp(x: number, min: number, max: number): number {
	return Math.max(min, Math.min(x, max));
}


export function intOr(x: any, ifNot: number): number {
	return (x === (x | 0)) ? x : ifNot;
}


export function realOr(x: any, ifNot: number): number {
	return isReal(x) ? x : ifNot;
}


export function numberOr(x: any, ifNot: number): number {
	return x === +x ? x : ifNot;
}


export function collect<T>(array: T[][]): T[] {
	return Array.prototype.concat.apply([], array);
}


export function dictMap<U, V>(
	func: (val: U, key: DictKey) => V,
	input: Dict<U> | U[],
	out: Dict<V> = {}
)
	:	Dict<V>
{
	for (let key in input) {
		out[key] = func(input[key], key);
	}
	return out;
}


export interface DictKeyValueMapper<U, V> {
	(inputValue: U, inputKey: DictKey): [V, DictKey];
}


export function dictMapKV<U, V>(
	func: DictKeyValueMapper<U, V>,
	input: Dict<U> | U[],
	out: Dict<V> = {}
)
	: Dict<V>
{
	for (let key in input) {
		const [v, k] = func(input[key], key);
		out[k] = v;
	}
	return out;
}
