export function noop(): void {
	/* tslint:enable:no-empty */
	/* tslint:disable:no-empty */
}


export function identity<T>(t: T): T {
	return t;
}


export function isReal(x: number): boolean {
	return x === +x;
}


export function isInt(x: number): boolean {
	return x === (x|0);
}


export function toInt(x: number): number {
	return x|0;
}


export function randInRange(min: number, max: number): number {
	return Math.random() * (max - min) - min;
}


export function randIntInRange(min: number, max: number): number {
	return toInt(randInRange(min, max));
}


export function clamp(x: number, min: number, max: number): number {
	return Math.max(min, Math.min(x, max));
}
