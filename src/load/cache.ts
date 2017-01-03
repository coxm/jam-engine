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


export function cache(
	store: Map<any, any>,
	keyGetter: SimpleKeyGetter | ComplexKeyGetter
)
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

		const original: Function = desc.value;
		desc.value = function cacheWrapper(this: any): any {
			const key: any = getKey.call(this, arguments);
			for (let [k, v] of store.entries()) {
				if (k === key) {
					return v;
				}
			}
			const result = original.apply(this, arguments);
			store.set(key, result);
			return result;
		};
	};
}


export function firstArgument(args: IArguments): any {
	return args[0];
}


export function cacheUnderFirstArgument(store: Map<any, any>)
	: MethodDecorator
{
	return cache(store, firstArgument);
}
