/**
 * Provide an iterable for a value or collection.
 *
 * If given an iterable object, `yield*`s the argument; otherwise, returns an
 * iterator which yields only the argument.
 *
 * @example
 * expect([...asIterable(5)]).toEqual([5]);
 * expect([...asIterable([5])]).toEqual([5]);
 */
export function* asIterable<T>(arg: T | Iterable<T>): Iterable<T> {
	if ((arg as Iterable<T>)[Symbol.iterator]) {
		yield* arg as Iterable<T>;
	}
	else {
		yield arg as T;
	}
}


export interface CancellableIterator<T> extends IterableIterator<T> {
	readonly cancelled: boolean;
	cancel(): void;
}


export function cancellable<T>(iterable: Iterable<T>): CancellableIterator<T> {
	let cancelled = false;
	function* iterator(): IterableIterator<T> {
		for (let t of iterable) {
			if (cancelled) {
				break;
			}
			yield t;
		}
	}
	const iter = iterator() as CancellableIterator<T>;
	iter.cancel = (): void => { cancelled = true; };
	(iter as any).cancelled = true;
	return iter;
}
