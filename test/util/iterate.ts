import {iterable, cancellable} from 'jam/util/iterate';


describe("iterable function", (): void => {
	const getArguments: any = function getArguments(): IArguments {
		return arguments;
	};

	it("yields all values if the argument is iterable", (): void => {
		expect([...iterable([1, 2, 3])]).toEqual([1, 2, 3]);
		expect([...iterable('hello')]).toEqual(['h', 'e', 'l', 'l', 'o']);

		const map = new Map([['a', 'A'], ['b', 'B'], ['c', 'C']]);
		expect([...iterable(map)]).toEqual([
			['a', 'A'], ['b', 'B'], ['c', 'C']
		]);
	});

	it("accepts iterable arguments objects", (): void => {
		const args = getArguments(1, 2, 3);
		if (!args[Symbol.iterator]) {
			args[Symbol.iterator] = function*() {
				for (let i = 0, len = args.length; i < len; ++i) {
					yield args[i];
				}
			};
		}
		expect([...iterable(args)]).toEqual([1, 2, 3]);
	});

	it("accepts non-iterable arguments objects", (): void => {
		const args = getArguments(1, 2, 3);
		delete args[Symbol.iterator];
		expect([...iterable(args)]).toEqual([1, 2, 3]);
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
