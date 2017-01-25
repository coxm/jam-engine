import {numberOr} from 'jam/util/misc';


export interface LengthRange {
	readonly gte: number;
	readonly len: number;
}


export interface IntervalRange {
	readonly gte: number;
	readonly lt: number;
}


export type Range = LengthRange | IntervalRange;


export function* range(range: Range): IterableIterator<number> {
	for (
		let i: number = range.gte,
			end: number = numberOr(
				(<IntervalRange> range).lt,
				(<LengthRange> range).len + i
			);
		i < end;
		++i
	) {
		yield i;
	}
}
