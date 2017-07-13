export interface SimpleKeyGetter {
	(this: any, args: IArguments): any;
}


export interface ComplexKeyGetter {
	(
		target: any,
		propKey: string,
		desc: PropertyDescriptor,
		args: IArguments
	): any;
}


export type AnyKeyGetter = (
	SimpleKeyGetter |
	ComplexKeyGetter
);


export interface StoreGetter {
	(
		this: any,
		target: any,
		propKey: string,
		desc: PropertyDescriptor
	): Map<any, any>;
}


export type AnyStoreArg = (
	Map<any, any> |
	StoreGetter |
	string |
	number |
	symbol
);


/**
 * Cache a method's return values.
 *
 * @see test/load/cache.ts for examples.
 *
 * @param store an `AnyStoreArg` type, for obtaining a store (`Map`) object.
 * @param keyGetter a function which determines cache keys.
 * @returns a method decorator function.
 */
export function cache(store: AnyStoreArg, keyGetter: AnyKeyGetter)
	: MethodDecorator
{
	return function decorator(
		target: any,
		propKey: string,
		desc: PropertyDescriptor
	)
		: void
	{
		if (typeof desc.value !== 'function') {
			throw new Error("Expected function");
		}

		const getKey: SimpleKeyGetter = (keyGetter.length === 1
			?	<SimpleKeyGetter> keyGetter
			:	function(this: any, args: IArguments): any {
					return keyGetter.call(this, target, propKey, desc, args);
				}
		);

		let getStore: StoreGetter;
		switch (typeof store) {
			case 'object':
				getStore = () => <Map<any, any>> store;
				break;
			case 'function':
				getStore = <StoreGetter> store;
				break;
			default:
				getStore = function(this: any): Map<any, any> {
					return this[<string> store] || (
						this[<string> store] = new Map()
					);
				};
				break;
		}

		const original: Function = desc.value;
		desc.value = function cacheWrapper(this: any): any {
			const key: any = getKey.call(this, arguments);
			const theStore = getStore.call(this, target, propKey, desc);
			for (const [k, v] of theStore.entries()) {
				if (k === key) {
					return v;
				}
			}
			const result = original.apply(this, arguments);
			theStore.set(key, result);
			return result;
		};
	};
}


export function firstArgument(args: IArguments): any {
	return args[0];
}


export function cacheUnderFirstArgument(store: AnyStoreArg): MethodDecorator {
	return cache(store, firstArgument);
}
