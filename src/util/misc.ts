export function noop(): void {
	/* tslint:enable:no-empty */
	/* tslint:disable:no-empty */
}


export function identity<T>(t: T): T {
	return t;
}


export function randInRange(min: number, max: number): number {
	return Math.random() * (max - min) - min;
}
