import {Range, range, combine} from 'jam/util/range';


describe("range", (): void => {
	function test(msg: string, input: Range, output: number[]): void {
		it(msg, (): void => {
			const iter = range(input);
			const array = [...iter];
			expect(array).toEqual(output);
		});
	}

	test(
		"works for length ranges",
		{beg: -4, len: 6},
		[-4, -3, -2, -1, 0, 1]
	);

	test(
		"works for interval ranges",
		{beg: -4, pre: 2},
		[-4, -3, -2, -1, 0, 1]
	);

	test(
		"can step by arbitrary positive amounts (length)",
		{beg: -4, len: 4, by: 1.5},
		[-4, -2.5, -1, 0.5]
	);

	test(
		"can step by arbitrary negative amounts (length)",
		{beg: 2, pre: -4, by: -1.5},
		[2, 0.5, -1, -2.5]
	);

	test(
		"can step by arbitrary positive amounts (length)",
		{beg: -4, len: 4, by: 1.5},
		[-4, -2.5, -1, 0.5]
	);

	test(
		"can step by arbitrary negative amounts (length)",
		{beg: 2, len: 4, by: -1.5},
		[2, 0.5, -1, -2.5]
	);
});


describe("combine", (): void => {
	it("combines numbers", (): void => {
		expect([...combine([1, 2, 3])]).toEqual([1, 2, 3]);
	});
	it("combines ranges", (): void => {
		expect([...combine([
			{beg: 1, len: 3},
			{beg: 5, pre: 8}
		])])
		.toEqual([1, 2, 3, 5, 6, 7]);
	});
	it("combines a mixture of numbers and ranges", (): void => {
		expect([...combine([
			{beg: 1, len: 3},
			4,
			{beg: 5, pre: 8}
		])])
		.toEqual([1, 2, 3, 4, 5, 6, 7]);
	});
});
