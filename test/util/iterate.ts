import {asIterable, cancellable} from 'jam/util/iterate';


describe("asIterable function", (): void => {
	it("yields the value if the argument is not iterable", (): void => {
		expect([...asIterable(4)]).toEqual([4]);
		expect([...asIterable({x: 1})]).toEqual([{x: 1}]);
	});

	it("yields all values if the argument is iterable", (): void => {
		expect([...asIterable([1, 2, 3])]).toEqual([1, 2, 3]);
		expect([...asIterable('hello')]).toEqual(['h', 'e', 'l', 'l', 'o']);

		const map = new Map([['a', 'A'], ['b', 'B'], ['c', 'C']]);
		expect([...asIterable(map)]).toEqual([
			['a', 'A'], ['b', 'B'], ['c', 'C']
		]);
	});
});


describe("cancellable function", (): void => {
	it("returns an iterator which iterates as normal", (): void => {
		expect([...cancellable([1, 2, 3])]).toEqual([1, 2, 3]);
		expect([...cancellable('hello')]).toEqual(['h', 'e', 'l', 'l', 'o']);
	});

	it("returns an iterator which can be cancelled", (): void => {
		const iter = cancellable([1, 2, 3]);
		expect(iter.next().value).toBe(1);
		iter.cancel();
		const next = iter.next();
		expect(next.done).toBe(true);
	});
});
