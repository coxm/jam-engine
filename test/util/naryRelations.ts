import * as nary from 'jam/util/naryRelations';


describe("n-ary relation", (): void => {
	function testArgs() {
		return [
			[1, 1, 1],
			[1, 2, 3],
			[3, 2, 1],
			[1, 1, 2],
			[3, 3, 2],
		];
	}

	function testRelation(
		relation: keyof typeof nary.relations,
		expectations: boolean[]
	)
		:	void
	{
		describe(relation, (): void => {
			testArgs().forEach((args: number[], i: number): void => {
				const expected: boolean = expectations[i];
				it(`evaluates [${args}] to ${expected}`, (): void => {
					const fn = nary.relations[relation];
					expect(fn(args)).toBe(expected);
				});
			});
		});
	}

	testRelation('eq', [true, false, false, false, false]);
	testRelation('lt', [false, true, false, false, false]);
	testRelation('lte', [true, true, false, true, false]);
	testRelation('gt', [false, false, true, false, false]);
	testRelation('gte', [true, false, true, false, true]);
});
