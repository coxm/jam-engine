import * as br from 'jam/util/binaryRelations';
import {BinaryRelationType} from 'jam/util/BinaryRelationType';


describe("BinaryRelations", (): void => {
	function testRelation(
		type: BinaryRelationType,
		fn: (x: any, y: any) => boolean
	)
		: boolean
	{
		const relation = br.relations[type];
		const samples = [
			0, 1, -1, 123, -12973, NaN,
			'a', '', 'oahea', '10283hU a29'
		];
		for (let x of samples) {
			for (let y of samples) {
				if (relation(x, y) !== fn(x, y)) {
					return false;
				}
			}
		}
		return true;
	}

	function runTest(
		type: BinaryRelationType,
		fn: (x: any, y: any) => boolean
	)
		: void
	{
		expect(testRelation(type, fn)).toBe(true);
	}

	it("eq behaves like === equality", (): void => {
		runTest(BinaryRelationType.eq, (x: any, y: any) => x === y);
	});
	it("neq behaves like !== equality", (): void => {
		runTest(BinaryRelationType.neq, (x: any, y: any) => x !== y);
	});
	it("lt behaves like <", (): void => {
		runTest(BinaryRelationType.lt, (x: any, y: any) => x < y);
	});
	it("lte behaves like <=", (): void => {
		runTest(BinaryRelationType.lte, (x: any, y: any) => x <= y);
	});
	it("gt behaves like >", (): void => {
		runTest(BinaryRelationType.gt, (x: any, y: any) => x > y);
	});
	it("gte behaves like >=", (): void => {
		runTest(BinaryRelationType.gte, (x: any, y: any) => x >= y);
	});
});
