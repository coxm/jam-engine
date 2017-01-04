import {ActorDef, PartialActorDef} from 'jam/actors/Actor';
import {Loader} from 'jam/actors/Loader';


describe("Actor Loader", (): void => {
	const baseUrl: string = 'baseUrl';
	let loader: Loader = <any> null;

	beforeEach((): void => {
		loader = new Loader({
			baseUrl: baseUrl,
		});
	});

	describe("actorDef method", (): void => {
		const relpath: string = 'relpath';
		let root: PartialActorDef = <any> null;

		beforeEach((): void => {
			root = {
				position: [0, 0],
				cmp: [],
			};
		});

		it("loads the JSON file of the same name", (done): void => {
			spyOn(loader, 'json').and.returnValue(Promise.resolve(root));
			loader.actorDef(relpath).then(
				(): void => {
					expect(loader.json).toHaveBeenCalledWith(relpath);
					done();
				},
				fail
			);
		});
		it("returns the loaded JSON if no dependencies", (done): void => {
			spyOn(loader, 'json').and.returnValue(Promise.resolve(root));
			loader.actorDef(relpath).then(
				(def: ActorDef): void => {
					expect(def).toBe(root);
					done();
				},
				fail
			);
		});

		describe("merges dependencies if required", (): void => {
			let files: {
				[name: string]: PartialActorDef;
				root: PartialActorDef;
				DefB: PartialActorDef;
				DefC: PartialActorDef;
			} = <any> null;

			/*
			Since DefB depends on DefC, we expect DefB to be evaluated as
			{
				alias: 'DefB',
				depends: ['DefC'],
				position: [0, 0],
				cmp: [{factory: 'Factory1'}, {factory: 'Factory2'}],
			}

			Then root is evaluated by merging [root, DefB], i.e. to
			{
				alias: 'DefB',
				depends: ['DefB', 'DefC'],
				position: [1, 1],
				cmp: [
					{factory: 'Factory1'},
					{factory: 'Factory2'},
					{factory: 'Factory3'}
				],
			}
			*/

			beforeEach((): void => {
				files = {
					// Top-level actor definition.
					root: {
						cmp: [{factory: 'Factory3'}],
						depends: ['DefB'],
						position: [1, 1],
					},

					// Required by first definition but requires the next one.
					DefB: {
						alias: 'DefB',
						depends: 'DefC',
						position: [0, 0],
					},

					// Most fundamental def: components 
					DefC: {
						alias: 'DefC',
						cmp: [{factory: 'Factory1'}, {factory: 'Factory2'}],
					},
				};

				spyOn(loader, 'json').and.callFake(
					(rel: string): PartialActorDef =>
						Promise.resolve(files[rel])
				);
			});

			it("resolving with the merged definition", (done): void => {
				loader.actorDef('root').then(
					(def: ActorDef): void => {
						// Note: DefB is higher priority than DefC, so DefB's
						// alias is used.
						expect(def.alias).toBe('DefB');
						// Similarly the root's position is used.
						expect(def.position).toEqual([1, 1]);
						expect(def.depends).toEqual(['DefB', 'DefC']);
						expect(def.cmp).toEqual([
							{factory: 'Factory1'},
							{factory: 'Factory2'},
							{factory: 'Factory3'}
						]);
						done();
					},
					fail
				);
			});
		});
	});
});
