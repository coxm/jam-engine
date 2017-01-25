import {range, Range} from 'jam/util/range';


describe("rangeIndices", (): void => {
	function test(msg: string, input: Range, output: number[]): void {
		it(msg, (): void => {
			const iter = range(input);
			expect([...iter]).toEqual(output);
		});
	}

	test(
		"works for length ranges",
		{gte: -4, len: 6},
		[-4, -3, -2, -1, 0, 1]
	);

	test(
		"works for interval ranges",
		{gte: -4, lt: 2},
		[-4, -3, -2, -1, 0, 1]
	);
});
