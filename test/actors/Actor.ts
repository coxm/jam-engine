import {mergeActorDefs, ActorDef, PartialActorDef} from 'jam/actors/Actor';


describe("mergeActorDefs", (): void => {
	it("returns an empty actor def if given no definitions", (): void => {
		const def = mergeActorDefs([]);
		expect(def).toEqual({
			alias: '',
			depends: [],
			cmp: [],
			position: [0, 0],
		});
	});

	describe("merges properties", (): void => {
		let defs: PartialActorDef[] = [];
		let def: ActorDef = <any> null;

		beforeEach((): void => {
			defs = [
				{ // Top-level actor definition.
					cmp: [{factory: 'Factory3'}],
					depends: ['DefB', 'DefC'],
					position: [1, 1],
				},
				{ // Required by first definition but requires the next one.
					alias: 'DefB',
					depends: 'DefC',
					position: [0, 0],
				},
				{ // Most fundamental def: components 
					alias: 'DefC',
					cmp: [{factory: 'Factory1'}, {factory: 'Factory2'}],
				}
			];
			def = mergeActorDefs(defs);
		});

		it("using the first alias", (): void => {
			expect(def.alias).toBe('DefB');
		});
		it("using the first position", (): void => {
			expect(def.position).toEqual([1, 1]);
		});
		it("concatenating `depends` (including duplicates)", (): void => {
			expect(def.depends).toEqual(['DefB', 'DefC', 'DefC']);
		});
		it("adding components in order of requirement", (): void => {
			expect(def.cmp).toEqual([
				{factory: 'Factory1'},
				{factory: 'Factory2'},
				{factory: 'Factory3'}
			]);
		});
	});
});


describe("Actor", (): void => {
	"setCmp"
	"removeCmp"
	"init"
	"deinit"
	"destroy"
});
