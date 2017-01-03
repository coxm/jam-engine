import {cache, cacheUnderFirstArgument} from 'jam/load/cache';


const store: Map<string | number, {value: number;}> = new Map();


class Dummy {
	uncached(a: number, b: number): {value: number;} {
		return {value: a + b};
	}

	@cache(store, (args: IArguments): string => [...args].join('-'))
	simple(a: number, b: number): {value: number;} {
		return this.uncached(a, b);
	}

	@cache(store, (
		target: any,
		propKey: string,
		desc: PropertyDescriptor,
		args: IArguments
	): string => [propKey, ...args].join('-'))
	complex(a: number, b: number): {value: number;} {
		return this.uncached(a, b);
	}

	@cacheUnderFirstArgument(store)
	first(a: number, b: number): {value: number;} {
		return this.uncached(a, b);
	}
}


describe("cache decorator", (): void => {
	let dummy: Dummy = <any> null;

	beforeEach((): void => {
		store.clear();
		dummy = new Dummy();
		spyOn(dummy, 'uncached').and.callThrough();
	});

	describe("(simple usage)", (): void => {
		it("returns the expected result", (): void => {
			expect(dummy.simple(1, 2)).toEqual({value: 3});
		});
		it("caches results in the provided store", (): void => {
			dummy.simple(1, 2);
			expect(store.get('1-2')).toEqual({value: 3});
		});
		it("uses results from the store if possible", (): void => {
			const result = {value: 42};
			store.set('1-2', result);
			expect(dummy.simple(1, 2)).toBe(result);
			expect(dummy.uncached).not.toHaveBeenCalled();
		});
	});

	describe("(complex usage)", (): void => {
		it("returns the expected result", (): void => {
			expect(dummy.complex(1, 2)).toEqual({value: 3});
		});
		it("caches results in the provided store", (): void => {
			dummy.complex(1, 2);
			expect(store.get('complex-1-2')).toEqual({value: 3});
		});
		it("uses results from the store if possible", (): void => {
			const result = {value: 42};
			store.set('complex-1-2', result);
			expect(dummy.complex(1, 2)).toBe(result);
			expect(dummy.uncached).not.toHaveBeenCalled();
		});
	});
});


describe("cacheUnderFirstArgument decorator", (): void => {
	let dummy: Dummy = <any> null;

	beforeEach((): void => {
		store.clear();
		dummy = new Dummy();
		spyOn(dummy, 'uncached').and.callThrough();
	});

	it("returns the expected result", (): void => {
		expect(dummy.first(1, 2)).toEqual({value: 3});
	});
	it("caches results in the provided store by the first arg", (): void => {
		const result = dummy.first(1, 2);
		expect(store.get(1)).toBe(result);
		expect(dummy.first(1, 3)).toBe(result);
	});
	it("uses results from the store if possible", (): void => {
		const result = {value: 42};
		store.set(1, result);
		expect(dummy.first(1, 2)).toBe(result);
		expect(dummy.uncached).not.toHaveBeenCalled();
	});
});
