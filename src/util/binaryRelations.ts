export interface BinaryRelation {
	<T>(a: T, b: T): boolean;
}


export const eq = <T>(a: T, b: T) => a === b;
export const neq = <T>(a: T, b: T) => a !== b;
export const lt = <T>(a: T, b: T) => a < b;
export const lte = <T>(a: T, b: T) => a <= b;
export const gt = <T>(a: T, b: T) => a > b;
export const gte = <T>(a: T, b: T) => a >= b;


export const relations: BinaryRelation[] = [
	eq,
	neq,
	lt,
	lte,
	gt,
	gte
];
