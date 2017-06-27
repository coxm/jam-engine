export interface BinaryRelation {
	<T>(a: T, b: T): boolean;
}


export interface NAryRelation {
	<T>(iterable: Iterable<T>): boolean;
}


export function transitively(fn: BinaryRelation): NAryRelation {
	return function<T>(iterable: Iterable<T>): boolean {
		const iter = iterable[Symbol.iterator]();
		let next = iter.next();
		let prev = next.value;
		while (!(next = iter.next()).done) {
			if (!fn(prev, next.value)) {
				return false;
			}
			prev = next.value;
		}
		return true;
	};
}


export const eq = transitively(<T>(a: T, b: T) => a === b);
export const lt = transitively(<T>(a: T, b: T) => a < b);
export const lte = transitively(<T>(a: T, b: T) => a <= b);
export const gt = transitively(<T>(a: T, b: T) => a > b);
export const gte = transitively(<T>(a: T, b: T) => a >= b);


export const relations = {
	eq,
	lt,
	lte,
	gt,
	gte,
};
