const UNDEFINED: symbol = Symbol('undefined');
const NULL: symbol = Symbol('null');


const hashSymKey = Symbol('#jam-sym#');


export function sym(val: Object | Function | null | undefined): symbol {
	switch (val) {
		case null:
			return NULL;
		case undefined:
			return UNDEFINED;
		default:
			return (<any> val)[hashSymKey] || (
				(<any> val)[hashSymKey] = Symbol()
			);
	}
}


let counter: number = 0;
const NULL_NUM: number = 0;
const UNDEFINED_NUM: number = 1;

const hashNumKey = Symbol('#jam-num#');


export function num(val: Object | Function | null | undefined): number {
	switch (val) {
		case null:
			return NULL_NUM;
		case undefined:
			return UNDEFINED_NUM;
		default:
			return (<any> val)[hashKey] || (
				(<any> val)[hashKey] = ++counter
			);
	}
}


export function str(val: any): string {
	if (!val) {
		return ('' + val)[0];
	}
	return '' + num(val);
}


export const combine: (...args: any[]) => string = function(): string {
	const hashes: string[] = [];
	for (let i: number = 0, len: number = arguments.length; i < len; ++i) {
		hashes.push(str(arguments[i]));
	}
	return hashes.join('_');
};
