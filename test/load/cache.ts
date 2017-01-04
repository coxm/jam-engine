import {cache, cacheUnderFirstArgument} from 'jam/load/cache';


type Store = Map<string | number, {value: number;}>;
const store: Store = new Map();


function hyphenateArgs(args: IArguments): string {
	return [...args].join('-');
}


class Dummy {
	storeGetter_cache: Store;
	storePropertyName_cache: Store;

	uncached(a: number, b: number): {value: number;} {
		return {value: a + b};
	}

	/** Simple caching example. */
	@cache(store, hyphenateArgs)
	simple(a: number, b: number): {value: number;} {
		return this.uncached(a, b);
	}

	/** More complex example: use the property name to inform cache keys. */
	@cache(store, (
		target: any,
		propKey: string,
		desc: PropertyDescriptor,
		args: IArguments
	): string => [propKey, ...args].join('-'))
	complex(a: number, b: number): {value: number;} {
		return this.uncached(a, b);
	}

	/** Use a custom store getter to set the store. */
	@cache(
		function(this: Dummy, target: any, propKey: string): Store {
			return (<any> this)[propKey + '_cache'] = store;
		},
		hyphenateArgs
	)
	storeGetter(a: number, b: number): {value: number;} {
		return this.uncached(a, b);
	}

	@cache('storePropertyName_cache', hyphenateArgs)
	storePropertyName(a: number, b: number): {value: number;} {
		return this.uncached(a, b);
	}

	/** Simply cache values in `store` under the first argument. */
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

	describe("(store getter)", (): void => {
		it("can modify the owner", (): void => {
			dummy.storeGetter(1, 2);
			expect(dummy.storeGetter_cache).toBe(store);
		});
		it("doesn't modify the target's prototype", (): void => {
			dummy.storeGetter(1, 2);
			expect(Dummy.prototype.storeGetter_cache).not.toBeDefined();
		});
		it("returns the expected result", (): void => {
			expect(dummy.storeGetter(1, 2)).toEqual({value: 3});
		});
		it("caches results in the provided store", (): void => {
			dummy.storeGetter(1, 2);
			expect(store.get('1-2')).toEqual({value: 3});
		});
		it("uses results from the store if possible", (): void => {
			const result = {value: 42};
			store.set('1-2', result);
			expect(dummy.storeGetter(1, 2)).toBe(result);
			expect(dummy.uncached).not.toHaveBeenCalled();
		});
		it("doesn't modify the target's prototype", (): void => {
			dummy.storeGetter(1, 2);
			expect(Dummy.prototype.storeGetter_cache).not.toBeDefined();
		});
	});

	describe("(store property name)", (): void => {
		it("does not initialise the store until called", (): void => {
			expect(dummy.storePropertyName_cache).toBe(undefined);
		});
		it("creates the store if it doesn't exist", (): void => {
			dummy.storePropertyName(1, 2);
			expect(dummy.storePropertyName_cache instanceof Map).toBe(true);
		});
		it("returns the expected result", (): void => {
			expect(dummy.storePropertyName(1, 2)).toEqual({value: 3});
		});
		it("caches results in the provided store", (): void => {
			dummy.storePropertyName(1, 2);
			expect(dummy.storePropertyName_cache.get('1-2')).toEqual({
				value: 3
			});
		});
		it("uses results from the store if possible", (): void => {
			const result = {value: 42};
			dummy.storePropertyName_cache =  new Map([['1-2', result]]);
			expect(dummy.storePropertyName(1, 2)).toBe(result);
			expect(dummy.uncached).not.toHaveBeenCalled();
		});
		it("doesn't modify the target's prototype", (): void => {
			dummy.storePropertyName(1, 2);
			expect(Dummy.prototype.storePropertyName_cache).not.toBeDefined();
		});

		describe("uses the existing store", (): void => {
			let newStore: Map<any, any> = <any> null;

			beforeEach((): void => {
				dummy.storePropertyName_cache = newStore = new Map();
			});

			it("if set", (): void => {
				dummy.storePropertyName(1, 2);
				expect(newStore.get('1-2')).toEqual({value: 3});
			});
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
