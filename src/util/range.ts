export interface LengthRange {
	readonly beg: number;
	readonly len: number;
	readonly by?: number;
}


export interface IntervalRange {
	readonly beg: number;
	readonly pre: number;
	readonly by?: number;
}


export type Range = LengthRange | IntervalRange;


/**
 * Create a range iterator.
 *
 * @param range.gte the (inclusive) lower bound.
 * @param range.len optionally specify a maximum length.
 * @param
 * @param range.by the step (can be negative); defaults to 1.
 */
export function* range(range: Range): IterableIterator<number> {
	const step: number = range.by || 1;
	let cont: (i: number) => boolean;
	if ((<IntervalRange> range).pre) {
		const pre: number = (<IntervalRange> range).pre;
		cont = (step < 0
			?	((i: number): boolean => i > pre)
			:	((i: number): boolean => i < pre)
		);
	}
	else {
		let count: number = (<LengthRange> range).len;
		cont = i => --count >= 0;
	}

	for (let i: number = range.beg; cont(i); i += step) {
		yield i;
	}
}


export function* combine(ranges: Iterable<number|Range>)
	: IterableIterator<number>
{
	for (const item of ranges) {
		if (item === +item) {
			yield item;
		}
		else {
			for (const i of range(<Range> item)) {
				yield i;
			}
		}
	}
}
