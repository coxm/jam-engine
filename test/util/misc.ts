import {
	noop,
	identity,
	isReal,
	isInt,
	collect,
}
from 'jam/util/misc';


it("noop does nothing", (): void => {
	expect(noop()).not.toBeDefined();
});

it("identity returns the first argument", (): void => {
	const x = {};
	expect(identity(x)).toBe(x);
	expect(identity(1)).toBe(1);
});

describe("numeric utility", (): void => {
	function andNegated(array: number[]): number[] {
		return array.concat(array.map((n: number): number => -n));
	}

	let integers: number[] = [];
	let floats: number[] = [];
	
	beforeEach((): void => {
		integers = andNegated([
			0,
			1,
			123812,
			1082739,
		]);

		floats = andNegated([
			Math.PI,
			1.23,
			32.5
		]);
	});

	describe("isInt", (): void => {
		it("returns true for integers", (): void => {
			for (let i of integers) {
				expect(isInt(i)).toBe(true);
			}
		});
		it("returns false for floats", (): void => {
			for (let f of floats) {
				expect(isInt(f)).toBe(false);
			}
		});
	});

	describe("isReal", (): void => {
		it("returns true for integers", (): void => {
			for (let i of integers) {
				expect(isReal(i)).toBe(true);
			}
		});
		it("returns true for floats", (): void => {
			for (let f of floats) {
				expect(isReal(f)).toBe(true);
			}
		});
		it("returns false for infinite values", (): void => {
			expect(isReal(Infinity)).toBe(false);
			expect(isReal(-Infinity)).toBe(false);
		});
		it("returns false for strings", (): void => {
			expect(isReal(<any> '5')).toBe(false);
		});
	});
});


describe("collect", (): void => {
	it("collects all arrays in an array together", (): void => {
		expect(collect<number|string>([
			[1, 2, 3],
			['apple', 'pear']
		])).toEqual([1, 2, 3, 'apple', 'pear']);
	});
});
