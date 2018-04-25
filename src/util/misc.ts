export const EPSILON: number = 1e-10;


export function noop(): void {
	/* tslint:enable:no-empty */
	/* tslint:disable:no-empty */
}


export const foreverTrue = () => true;


export const foreverFalse = () => false;


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


export function uniqueKey<T>(x: T): keyof T {
	let unique: any = undefined;
	for (const key in x) {
		if (unique !== undefined) {
			throw new Error("Key not unique");
		}
		unique = key;
	}
	if (unique === undefined) {
		throw new Error("No keys");
	}
	return unique;
}


export function anyKey<T>(x: T): keyof T {
	for (const key in x) {
		return key;
	}
	throw new Error("No keys");
}


export function forceArray<T>(x: T | T[]): T[] {
	return (x instanceof Array) ? x : [x];
}


export const sleep = (milliseconds: number) => new Promise<void>(
	resolve => setTimeout(resolve, milliseconds)
);


export interface Dict<V> {
	[key: number]: V;
	[key: string]: V;
}


export type DictKey = string | number | symbol;


export function dictMap<InVal, OutVal, Out extends Object & Dict<OutVal>>(
	out: Out,
	input: Dict<InVal> | InVal[],
	func: (val: InVal, key: DictKey) => OutVal
)
	:	Out & Dict<OutVal>
{
	for (const key in input) {
		out[key] = func(input[key], key);
	}
	return out;
}
