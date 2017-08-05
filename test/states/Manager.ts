import {Relation} from 'jam/states/Relation';
import {State} from 'jam/states/State';
import {Manager, Identifier} from 'jam/states/Manager';


enum Trigger {
	trigger1,
}


function createManager(): Manager<State, Trigger> {
	return new Manager<State, Trigger>();
}


interface TestInitialiser {
	(): {
		manager: Manager<State, Trigger>;
		childKey: Identifier;
		child: State;
		parentKey: Identifier;
		parent: State;
	};
}


function testChild(init: TestInitialiser): void {
	describe("", (): void => {
		let manager: Manager<State, Trigger>;
		let childKey: Identifier;
		let child: State;
		let parentKey: Identifier;
		let parent: State;

		beforeEach((): void => {
			const obj = init();
			manager = obj.manager;
			parent = obj.parent;
			child = obj.child;
			parentKey = obj.parentKey;
			childKey = obj.childKey;
		});

		describe("which can be accessed via", (): void => {
			it("at", (): void => {
				expect(manager.at(childKey)).toBe(child);
			});
			it("values", (): void => {
				const values = [...manager.values()];
				expect(values.indexOf(child)).not.toBeLessThan(0);
			});
			it("entries", (): void => {
				let found: boolean = false;
				for (let pair of manager.entries()) {
					if (child === pair[1]) {
						found = true;
						break;
					}
				}
				expect(found).toBe(true);
			});
			it("children", (): void => {
				const children = [...manager.children(parentKey)];
				expect(children.find(pair => pair[1] === child)).toBeDefined();
			});
			it("siblings", (): void => {
				const siblings = [...manager.siblings(childKey)];
				expect(siblings.find(pair => pair[1] === child)).toBeDefined();
			});
		});
		describe("which can be observed via", (): void => {
			it("has", (): void => {
				expect(manager.has(childKey));
			});
			it("keys", (): void => {
				const keys = [...manager.keys()];
				const id = manager.id(childKey);
				expect(keys.indexOf(id)).not.toBeLessThan(0);
			});
			it("hasChildren", (): void => {
				expect(manager.hasChildren(parentKey)).toBe(true);
			});
		});
		describe("whose parent can be accessed via", (): void => {
			it("tryParent", (): void => {
				expect(manager.tryParent(childKey)).toEqual([
					parentKey,
					parent
				]);
			});
			it("ancestors", (): void => {
				expect([...manager.ancestors(childKey)]).toEqual([
					[childKey, child],
					[parentKey, parent]
				]);

				expect([...manager.ancestors(childKey, true)]).toEqual([
					[parentKey, parent]
				]);
			});
		});
	});
}


describe("Manager add method", (): void => {
	let manager: Manager<State, Trigger>;

	beforeEach((): void => {
		manager = createManager();
	});

	it("sets an alias if provided", (): void => {
		const state = new State();
		const alias = 'test-alias';
		manager.add(state, {alias});
		expect(manager.at(alias)).toBe(state);
		expect(manager.has(alias)).toBe(true);
	});

	describe("adds a state which can be", (): void => {
		let state: State;
		let id: number;

		beforeEach((): void => {
			state = new State();
			id = manager.add(state);
		});

		describe("accessed via", (): void => {
			it("at", (): void => {
				expect(manager.at(id)).toBe(state);
			});
			it("values", (): void => {
				const values = [...manager.values()];
				expect(values.length).toBe(1);
				expect(values[0]).toBe(state);
			});
			it("entries", (): void => {
				const entries = [...manager.entries()];
				expect(entries.length).toBe(1);
				expect(entries[0][0]).toBe(id);
				expect(entries[0][1]).toBe(state);
			});
		});
		describe("observed via", (): void => {
			it("has", (): void => {
				expect(manager.has(id)).toBe(true);
			});
			it("keys", (): void => {
				const keys = [...manager.keys()];
				expect(keys.length).toBe(1);
				expect(keys[0]).toBe(id);
			});
		});
	});

	describe("can add children", (): void => {
		testChild(() => {
			const parent = new State();
			const child = new State();
			const childKey = manager.add(child);
			const parentKey = manager.add(parent, {
				children: [childKey],
			});
			return {
				manager,
				parent,
				child,
				parentKey,
				childKey,
			};
		});
	});

	it("can create the parent", (): void => {
		const parent = new State();
		const childID = manager.add(new State(), {parent});
		const pair = manager.tryParent(childID);
		expect(pair).toBeTruthy();
		expect(pair![1]).toBe(parent);
	});
});


describe("Manager appendChild method", (): void => {
	let manager: Manager<State, Trigger>;

	beforeEach((): void => {
		manager = createManager();
	});

	describe("can add new child states", (): void => {
		testChild(() => {
			const child = new State();
			const parent = new State();
			const parentKey = manager.add(parent);
			const childKey = manager.appendChild(parentKey, child);
			return {
				manager,
				parent,
				child,
				parentKey,
				childKey,
			};
		});
	});

	describe("can append existing states", (): void => {
		testChild(() => {
			const child = new State();
			const parent = new State();
			const parentKey = manager.add(parent);
			const childKey = manager.add(child);
			manager.appendChild(parentKey, childKey);
			return {
				manager,
				parent,
				child,
				parentKey,
				childKey,
			};
		});
	});
});


describe("Manager setParent method", (): void => {
	let manager: Manager<State, Trigger>;
	let child: State;
	let parent: State;
	let childID: number;

	beforeEach((): void => {
		manager = createManager();
		child = new State();
		childID = manager.add(child);
		parent = new State();
	});

	it("throws if given an invalid ID", (): void => {
		expect((): void => { manager.setParent(childID, 123); }).toThrow();
	});
	it("throws if given an invalid alias", (): void => {
		expect((): void => { manager.setParent(childID, 'alias'); }).toThrow();
	});

	it("can create new states to set as the parent", (): void => {
		const id = manager.setParent(childID, parent);
		expect(manager.at(id)).toBe(parent);
	});

	describe("can set an existing state as the parent", (): void => {
		let parentID: number;
		const parentAlias: string = 'parent';
		beforeEach((): void => {
			parentID = manager.add(parent, {alias: parentAlias});
		});

		function check(): void {
			expect(manager.tryParent(childID)).toEqual([parentID, parent]);
			expect([...manager.children(parentID)]).toEqual(
				[[childID, child]]);
		}

		it("if given an ID", (): void => {
			manager.setParent(childID, parentID);
			check();
		});
		it("if given an alias", (): void => {
			manager.setParent(childID, parentAlias);
			check();
		});
	});

	it("removes the node from its previous parent if any", (): void => {
		const parentID = manager.add(parent);
		const oldParent = new State();
		const oldParentID = manager.add(oldParent);
		manager.setParent(childID, parentID);

		expect(manager.tryParent(childID)).toEqual([parentID, parent]);
		expect([...manager.children(parentID)]).toEqual([[childID, child]]);
		expect([...manager.children(oldParentID)].length).toBe(0);
	});
});


describe("Manager count method", (): void => {
	let manager: Manager<State, Trigger>;
	let state: State;

	beforeEach((): void => {
		manager = createManager();
		manager.add(new State());
		state = new State();
	});

	it("returns the number of times a state is included", (): void => {
		expect(manager.count(state)).toBe(0);
		manager.add(state);
		expect(manager.count(state)).toBe(1);
		manager.add(state);
		expect(manager.count(state)).toBe(2);
		manager.add(state);
		expect(manager.count(state)).toBe(3);
	});
});


describe("Manager isUnique method", (): void => {
	let manager: Manager<State, Trigger>;
	let state: State;

	beforeEach((): void => {
		manager = createManager();
		manager.add(new State());
		state = new State();
	});

	it("returns false if the manager has no such state", (): void => {
		expect(manager.isUnique(state)).toBe(false);
	});
	it("returns true if the manager has a unique such state", (): void => {
		manager.add(state);
		expect(manager.isUnique(state)).toBe(true);
	});
	it("returns false if the manager has multiple such states", (): void => {
		manager.add(state);
		manager.add(state);
		expect(manager.isUnique(state)).toBe(false);
	});
});


describe("Manager tryNextSibling method", (): void => {
	let manager: Manager<State, Trigger>;
	let one: State;
	let two: State;
	let oneID: number;
	let twoID: number;

	beforeEach((): void => {
		manager = createManager();
	});

	it("returns null if the state has no parent", (): void => {
		one = new State();
		oneID = manager.add(one);
		expect(manager.tryNextSibling(oneID)).toBe(null);

		manager.setInitial(oneID);
		expect(manager.tryNextSibling()).toBe(null);
	});

	function test(): void {
		it("returns null if the state has no next sibling", (): void => {
			expect(manager.tryNextSibling(twoID)).toBe(null);
		});
		it("returns the next sibling and its ID if the", (): void => {
			const result = manager.tryNextSibling(oneID)!;
			expect(result[0]).toBe(twoID);
			expect(result[1]).toBe(two);
		});
		describe("checks the current state if no key is given", (): void => {
			it("(next sibling)", (): void => {
				manager.setInitial(oneID);
				const result = manager.tryNextSibling()!;
				expect(result[0]).toBe(twoID);
				expect(result[1]).toBe(two);
			});
			it("(no next sibling)", (): void => {
				manager.setInitial(twoID);
				expect(manager.tryNextSibling()).toBe(null);
			});
		});
	}

	describe("works when IDs are used for child arrays", (): void => {
		beforeEach((): void => {
			oneID = manager.add(one = new State());
			twoID = manager.add(two = new State());
			manager.add(new State(), {
				children: [oneID, twoID],
			});
		});
		test();
	});
	describe("works when aliases are used for child arrays", (): void => {
		beforeEach((): void => {
			oneID = manager.add(one = new State(), {alias: 'one'});
			twoID = manager.add(two = new State(), {alias: 'two'});
			manager.add(new State(), {
				alias: 'parent',
				children: ['one', 'two'],
			});
		});
		test();
	});
});


describe("Manager trigger method", (): void => {
	let manager: Manager<State, Trigger>;
	let changeArgs: any[];
	let initialID: number;
	let destID: number;
	let initialState: State;
	let destState: State;
	const initialAlias: string = 'initial';
	const destAlias: string = 'dest';

	function change(): void {
		changeArgs = Array.from(arguments);
	}

	beforeEach((): void => {
		manager = createManager();
		initialID = manager.add(initialState = new State(), {
			alias: initialAlias,
		});
		destID = manager.add(destState = new State(), {
			alias: destAlias,
		});
		manager.setInitial(initialID);
	});

	function expectArgsToBeCorrect(
		dest: {state: State; id: number; alias: string | undefined;} = {
			id: destID,
			state: destState,
			alias: destAlias,
		}
	)
		: void
	{
		expect(changeArgs.length).toBe(2);
		const arg = changeArgs[0];
		expect(arg.old).toEqual({
			id: initialID,
			state: initialState,
			alias: initialAlias,
		});
		expect(arg.new).toEqual(dest);
		expect(arg.trigger).toBe(Trigger.trigger1);
		expect(changeArgs[1]).toBe(manager);
	}

	it("calls onEmptyTransition if no such transition exists", (): void => {
		const spy = spyOn(manager, 'onEmptyTransition');
		manager.trigger(Trigger.trigger1);
		expect(spy).toHaveBeenCalledWith(Trigger.trigger1, initialState);
	});

	it("can transition to an ID", (): void => {
		manager.addTransitions(initialID, [{
			trigger: Trigger.trigger1,
			id: destID,
			change,
		}]);
		manager.trigger(Trigger.trigger1);
		expect(manager.current).toBe(destState);
		expectArgsToBeCorrect();
	});

	describe("can transition via", (): void => {
		it("Relation.same", (): void => {
			manager.addTransitions(initialID, [{
				trigger: Trigger.trigger1,
				rel: Relation.same,
				change,
			}]);
			manager.trigger(Trigger.trigger1);
			expect(manager.current).toBe(initialState);
			expectArgsToBeCorrect({
				id: initialID,
				state: initialState,
				alias: initialAlias,
			});
		});
		it("Relation.child", (): void => {
			manager.appendChild(initialID, destID);
			manager.addTransitions(initialID, [{
				trigger: Trigger.trigger1,
				rel: Relation.child,
				change,
			}]);
			manager.trigger(Trigger.trigger1);
			expect(manager.current).toBe(destState);
			expectArgsToBeCorrect();
		});
		it("Relation.parent", (): void => {
			manager.appendChild(destID, initialID);
			manager.addTransitions(initialID, [{
				trigger: Trigger.trigger1,
				rel: Relation.parent,
				change,
			}]);
			manager.trigger(Trigger.trigger1);
			expect(manager.current).toBe(destState);
			expectArgsToBeCorrect();
		});
		it("Relation.sibling", (): void => {
			const parent = new State();
			const parentID = manager.add(parent);
			manager.appendChildren(parentID, [initialID, destID]);
			manager.addTransitions(initialID, [{
				trigger: Trigger.trigger1,
				rel: Relation.sibling,
				change,
			}]);

			manager.trigger(Trigger.trigger1);
			expect(manager.current).toBe(destState);
			expectArgsToBeCorrect();
		});

		describe("Relation.siblingElseUp", (): void => {
			it("to a sibling (if extant)", (): void => {
				const parent = new State();
				const parentID = manager.add(parent);
				manager.appendChildren(parentID, [initialID, destID]);
				manager.addTransitions(initialID, [{
					trigger: Trigger.trigger1,
					rel: Relation.siblingElseUp,
					change,
				}]);

				manager.trigger(Trigger.trigger1);
				expect(manager.current).toBe(destState);
				expectArgsToBeCorrect();
			});
			it("to the parent (if no more siblings)", (): void => {
				const parent = new State();
				const parentID = manager.add(parent);
				// There are siblings, but initial is the *last*.
				manager.appendChildren(parentID, [destID, initialID]);
				manager.addTransitions(initialID, [{
					trigger: Trigger.trigger1,
					rel: Relation.siblingElseUp,
					change,
				}]);

				manager.trigger(Trigger.trigger1);
				expect(manager.current).toBe(parent);
				expectArgsToBeCorrect({
					id: parentID,
					state: parent,
					alias: undefined,
				});
			});
		});
	});

	it("can transition via a function", (): void => {
		const transition = {
			trigger: Trigger.trigger1,
			find(currentID: Identifier, current: State): Identifier {
				return NaN;
			},
		};
		const spy = spyOn(transition, 'find').and.returnValue(destID);
		manager.addTransitions(initialID, [transition]);
		manager.trigger(Trigger.trigger1);

		expect(spy).toHaveBeenCalledTimes(1);
		const call = spy.calls.first();
		expect(call.object).toBe(transition);
		expect(call.args).toEqual([initialID, initialState, manager]);
	});
});


describe("Manager iteration method", (): void => {

});
describe("Manager children method", (): void => {
	let manager: Manager<State, Trigger>;
	let parent: State;
	let parentID: number;
	let aliases: string[];

	beforeEach((): void => {
		manager = new Manager();
		aliases = [0, 1, 2].map(i => {
			const alias = 'alias-' + i;
			manager.add(new State(), {alias});
			return alias;
		});
		parent = new State();
		parentID = manager.add(parent, {
			children: [
				new State(),
				manager.add(new State()),
				aliases[0],
			],
		});
		manager.appendChild(parentID, new State());
		manager.appendChild(parentID, manager.add(new State()));
		manager.appendChild(parentID, aliases[1]);
		manager.appendChildren(parentID, [
			new State(),
			manager.add(new State()),
			aliases[2],
		]);
	});

	function testIterator(
		methodName: string,
		fn: () => IterableIterator<[number, State]>
	)
		: void
	{
		it(`${methodName} always returns IDs as identifiers`, (): void => {
			const pairs = [...fn()];
			expect(pairs.length).toBeGreaterThan(0);

			let allNumeric = true;
			for (let pair of pairs) {
				if (typeof pair[0] !== 'number') {
					allNumeric = false;
					break;
				}
			}
			expect(allNumeric).toBe(true);
		});
	}


	testIterator("entries", () => manager.entries());
	testIterator("children", () => manager.children(parentID));
	testIterator("siblings", () => manager.siblings(aliases[0]));
	testIterator("ancestors", () => manager.ancestors(parentID));
});
