import {
	Component,
	mergeActorDefs,
	ActorDef,
	PartialActorDef,
	Actor,
} from 'jam/actors/Actor';


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
					depends: ['DefB'],
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
			expect(def.depends).toEqual(['DefB', 'DefC']);
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
	const actorID = Symbol('actor-id');

	describe("constructor", (): void => {
		let def: ActorDef = <any> null;

		beforeEach((): void => {
			def = {cmp: [], position: [0, 0]};
		});

		it("sets basic properties", (): void => {
			const cmp = {};
			const actor = new Actor(actorID, def, cmp, false);
			expect(actor.id).toBe(actorID);
			expect(actor.cmp).toBe(cmp);
		});
		it("initialises if init is omitted or true", (): void => {
			spyOn(Actor.prototype, 'init');
			const actor = new Actor(actorID, def, {});
			expect(actor.init).toHaveBeenCalled();
		});
		it("doesn't initialise if init is false", (): void => {
			spyOn(Actor.prototype, 'init');
			const actor = new Actor(actorID, def, {}, false);
			expect(actor.init).not.toHaveBeenCalled();
		});
	});

	describe("method", (): void => {
		let actor: Actor = <any> null;
		const cmpKey: string = 'test-cmp';

		beforeEach((): void => {
			actor = new Actor(actorID, {cmp: [], position: [0, 0]}, {});
		});

		function component(key: string = cmpKey): Component {
			return {
				onAdd(): void {
				},
				onRemove(): void {
				},
			};
		}

		describe("setCmp", (): void => {
			let cmp: Component = <any> null;

			beforeEach((): void => {
				cmp = component();
			});

			it("sets a component", (): void => {
				actor.setCmp(cmpKey, cmp);
				expect(actor.cmp[cmpKey]).toBe(cmp);
			});

			describe("is exception safe:", (): void => {
				it("does nothing if onAdd throws", (): void => {
					const old: Component = component();
					spyOn(cmp, 'onAdd').and.throwError('cmp.onAdd');
					actor.setCmp(cmpKey, old);
					try {
						actor.setCmp(cmpKey, cmp);
					}
					catch(err) {
					}
					expect(actor.cmp[cmpKey]).toBe(old);
					expect(actor.isInitialised(cmpKey)).toBe(true);
					expect(cmp.onAdd).not.toHaveBeenCalled();
				});
			});
		});

		describe("deleteCmp", (): void => {
			let cmp: Component = <any> null;

			beforeEach((): void => {
				cmp = component();
				actor.setCmp(cmpKey, cmp);
			});

			it("calls the component's onRemove method", (): void => {
				spyOn(cmp, 'onRemove');
				actor.deleteCmp(cmpKey);
				expect(cmp.onRemove).toHaveBeenCalledWith(actor);
			});

			describe("is exception safe:", (): void => {
				it("does nothing if onRemove fails", (): void => {
					spyOn(cmp, 'onRemove').and.throwError('cmp.onRemove');
					try {
						actor.deleteCmp(cmpKey);
					}
					catch(err) {
					}
					expect(actor.cmp[cmpKey]).toBe(cmp);
					expect(actor.isInitialised(cmpKey)).toBe(true);
				});
			});
		});

		describe("", (): void => {
			const initialisedKey: string = cmpKey;
			const uninitialisedKey: string = 'other-cmp';
			let initialised: Component = <any> null;
			let uninitialised: Component = <any> null;

			beforeEach((): void => {
				initialised = component();
				actor.setCmp(cmpKey, initialised);

				uninitialised = component(uninitialisedKey);
				actor.setCmp(cmpKey, uninitialised, false);
			});

			it("(sanity check)", (): void => {
				expect(actor.isInitialised(initialisedKey)).toBe(true);
				expect(actor.isInitialised(uninitialisedKey)).toBe(false);
			});

			describe("init", (): void => {
				it("ensures all components are initialised", (): void => {
					actor.init();
					expect(actor.isInitialised(initialisedKey)).toBe(true);
					expect(actor.isInitialised(uninitialisedKey)).toBe(true);
				});
				it("doesn't re-initialise components", (): void => {
					spyOn(initialised, 'onAdd');
					actor.init();
					expect(initialised.onAdd).not.toHaveBeenCalled();
				});
			});

			describe("deinit", (): void => {
				it("ensures all components are removed", (): void => {
					actor.deinit();
					expect(actor.isInitialised(initialisedKey)).toBe(false);
					expect(actor.isInitialised(uninitialisedKey)).toBe(false);
				});
				it("doesn't re-remove components", (): void => {
					spyOn(uninitialised, 'onRemove');
					actor.deinit();
					expect(uninitialised.onRemove).not.toHaveBeenCalled();
				});
			});
		});

		describe("destroy", (): void => {
			it("de-inits all components", (): void => {
				spyOn(actor, 'deinit');
				actor.destroy();
				expect(actor.deinit).toHaveBeenCalled();
			});
			it("deletes all components", (): void => {
				actor.destroy();
				expect(Object.keys(actor.cmp).length).toBe(0);
			});
		});
	});
});
