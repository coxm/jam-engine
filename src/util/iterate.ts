export const iterable: {
	<T>(arg: {[Symbol.iterator](): IterableIterator<T>;}): IterableIterator<T>;
	<T>(arg: T[]): IterableIterator<T>;
	<T>(arg: IArguments): IterableIterator<T>;
} = <T>(arg: Iterable<T> | T[] | IArguments): IterableIterator<T> => {
	// If arg is an `Iterable<T>`:
	if (typeof (arg as Iterable<T>)[Symbol.iterator] === 'function') {
		return (arg as IterableIterator<T>)[Symbol.iterator]();
	}

	// In case arg[Symbol.iterator] isn't available, e.g. if arg is an
	// Arguments object.
	const len: number = (arg as T[]).length;
	if (typeof len !== 'number') {
		throw new Error("Not iterable");
	}
	return (function*() {
		for (let i = 0; i < len; ++i) {
			yield (arg as T[])[i];
		}
	})() as IterableIterator<T>;
};


export interface ArgumentIteratorFn {
	<T>(args: IArguments): IterableIterator<T>;
}


export interface CancellableIterator<T> extends IterableIterator<T> {
	readonly cancelled: boolean;
	cancel(): void;
}


export function* reversed<T>(array: T[]): IterableIterator<T> {
	for (let i = array.length - 1; i >= 0; --i) {
		yield array[i];
	}
}


export function cancellable<T>(iterable: Iterable<T>): CancellableIterator<T> {
	let cancelled = false;
	function* iterator(): IterableIterator<T> {
		for (const t of iterable) {
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


export function* map<U, V>(iterable: Iterable<U>, fn: (u: U, i: number) => V)
	:	IterableIterator<V>
{
	let i = -1;
	for (const u of iterable) {
		yield fn(u, ++i);
	}
}
