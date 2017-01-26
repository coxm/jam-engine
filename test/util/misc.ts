import {
	noop,
	identity,
	isReal,
	isInt,
	intOr,
	realOr,
	numberOr,
	randInRange,
	collect,
	dictMap,
	dictMapKV,
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

	function testEitherOr(func: (x: any, ifNot: number) => number, allow: {
		ints: boolean;
		floats: boolean;
		infinities: boolean;
		nan: boolean;
	})
		: void
	{
		describe(func.name, (): void => {
			const defaultValue: number = -123456789;

			it(
				`returns the ${allow.ints ? 'value' : 'default'} for ints`,
				(): void => {
					if (allow.ints) {
						for (let i of integers) {
							expect(func(i, defaultValue)).toBe(i);
						}
					}
					else {
						for (let i of integers) {
							expect(func(i, defaultValue)).toBe(defaultValue);
						}
					}
				}
			);

			it(
				'returns the ' + (allow.floats ? 'value' : 'default') +
				' for proper floats',
				(): void => {
					if (allow.floats) {
						for (let f of floats) {
							expect(func(f, defaultValue)).toBe(f);
						}
					}
					else {
						for (let f of floats) {
							expect(func(f, defaultValue)).toBe(defaultValue);
						}
					}
				}
			);

			it(
				'returns the ' + (allow.infinities ? 'value' : 'default') +
				' for infinities',
				(): void => {
					if (allow.infinities) {
						expect(func(Infinity, defaultValue)).toBe(Infinity);
						expect(func(-Infinity, defaultValue)).toBe(-Infinity);
					}
					else {
						expect(func(Infinity, defaultValue))
							.toBe(defaultValue);
						expect(func(-Infinity, defaultValue))
							.toBe(defaultValue);
					}
				}
			);

			it(
				`returns the ${allow.nan ? 'value' : 'default'} for NaN`,
				(): void => {
					expect(func(NaN, defaultValue))
						.toBe(allow.nan ? NaN : defaultValue);
				}
			);

			it("returns the default for non-numbers", (): void => {
				for (let val of [null, {}, [], '1', '']) {
					expect(func(val, defaultValue)).toBe(defaultValue);
				}
			});
		});
	}

	testEitherOr(intOr, {
		ints: true,
		floats: false,
		infinities: false,
		nan: false,
	});

	testEitherOr(realOr, {
		ints: true,
		floats: true,
		infinities: false,
		nan: false,
	});

	testEitherOr(numberOr, {
		ints: true,
		floats: true,
		infinities: true,
		nan: false,
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

	describe("randInRange", (): void => {
		it("returns a value in the given range", (): void => {
			let a: number = 0;
			let b: number = 0;
			for (let i: number = 0; i < 100; ++i) {
				a = 10000 * Math.random() * 10000 - 5000;
				b = 10000 * Math.random() * 10000 - 5000;
				if (a > b) {
					[a, b] = [b, a];
				}

				const rand: number = randInRange(a, b);
				const str: string = `randInRange(${a}, ${b}) was ${rand}`;
				expect(a <= rand).toBe(true, str);
				expect(rand <= b).toBe(true, str);
			}
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


describe("dictMap", (): void => {
	let input: {[key: string]: number;};

	beforeEach((): void => {
		input = {
			a: 1,
			b: 2,
			c: 3,
		};
	});

	it("maps properties", (): void => {
		const mapped = dictMap(
			(v: number, k: string): string => `${k}_${v}`,
			input
		);

		expect(mapped).toEqual({
			a: 'a_1',
			b: 'b_2',
			c: 'c_3',
		});
	});

	it("adds to the output object if provided", (): void => {
		const output = {d: 'existing'};
		const mapped = dictMap(
			(v: number, k: string): string => `${k}_${v}`,
			input,
			output
		);
		expect(mapped).toBe(output);
		expect(output).toEqual({
			a: 'a_1',
			b: 'b_2',
			c: 'c_3',
			d: 'existing',
		});
	});
});


describe("dictMapKV", (): void => {
	let input: {[key: string]: number;};

	beforeEach((): void => {
		input = {
			a: 1,
			b: 2,
			c: 3,
		};
	});

	it("maps properties", (): void => {
		const mapped = dictMapKV((v: number, k: string) => [k, v], input);
		expect(mapped).toEqual({
			1: 'a',
			2: 'b',
			3: 'c',
		});
	});

	it("adds to the output object if provided", (): void => {
		const output = {d: 'existing'};
		const mapped = dictMapKV(
			(v: number, k: string) => [k, v],
			input,
			output
		);
		expect(mapped).toBe(output);
		expect(output).toEqual({
			1: 'a',
			2: 'b',
			3: 'c',
			d: 'existing',
		});
	});
});
