import {State, state as createState} from 'jam/states/State';
import {Manager, Alias} from 'jam/states/Manager';
import {Relation} from 'jam/states/Relation';


enum Trigger {
	trigger1,
}


function createManager(): Manager<State, Trigger> {
	return new Manager<State, Trigger>();
}


interface TestInitialiser {
	(): {
		manager: Manager<State, Trigger>;
		childKey: Alias;
		child: State;
		parentKey: Alias;
		parent: State;
	};
}


function testChild(init: TestInitialiser): void {
	describe("", (): void => {
		let manager: Manager<State, Trigger>;
		let childKey: Alias;
		let child: State;
		let parentKey: Alias;
		let parent: State;

		beforeEach((): void => {
			const obj = init();
			manager = obj.manager;
			parent = obj.parent;
			child = obj.child;
			parentKey = obj.parentKey;
			childKey = obj.childKey;
			(<any> window).o = obj;
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
		const state = createState('test');
		const alias = 'test-alias';
		manager.add(state, {alias});
		expect(manager.at(alias)).toBe(state);
		expect(manager.has(alias)).toBe(true);
	});

	describe("adds a state which can be", (): void => {
		let state: State;
		let id: number;

		beforeEach((): void => {
			state = createState('test');
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
			const parent = createState('parent');
			const child = createState('child');
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
});


describe("Manager appendChild method", (): void => {
	let manager: Manager<State, Trigger>;

	beforeEach((): void => {
		manager = createManager();
	});

	describe("can add new child states", (): void => {
		testChild(() => {
			const child = createState('child');
			const parent = createState('parent');
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
			const child = createState('child');
			const parent = createState('parent');
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


describe("Manager count method", (): void => {
	let manager: Manager<State, Trigger>;
	let state: State;

	beforeEach((): void => {
		manager = createManager();
		manager.add(createState('one'));
		state = createState('two');
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
		manager.add(createState('one'));
		state = createState('two');
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


describe("Manager trigger method", (): void => {
	let manager: Manager<State, Trigger>;
	let exitArgs: any[];
	let enterArgs: any[];
	let initialID: number;
	let destID: number;
	let initialState: State;
	let destState: State;

	function enter(): void {
		enterArgs = Array.from(arguments);
	}
	function exit(): void {
		exitArgs = Array.from(arguments);
	}

	beforeEach((): void => {
		manager = createManager();
		initialID = manager.add(initialState = createState('initial'));
		destID = manager.add(destState = createState('destination'));
		manager.set(initialID);
	});

	function expectArgsToBeCorrect(dest: State = destState): void {
		expect(exitArgs.length).toBe(3);
		expect(exitArgs[0]).toBe(initialState);
		expect(exitArgs[1]).toBe(Trigger.trigger1);
		expect(exitArgs[2]).toBe(manager);

		expect(enterArgs.length).toBe(3);
		expect(enterArgs[0]).toBe(dest);
		expect(enterArgs[1]).toBe(Trigger.trigger1);
		expect(enterArgs[2]).toBe(manager);
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
			enter,
			exit,
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
				enter,
				exit,
			}]);
			manager.trigger(Trigger.trigger1);
			expect(manager.current).toBe(initialState);
			expectArgsToBeCorrect(initialState);
		});
		it("Relation.child", (): void => {
			manager.appendChild(initialID, destID);
			manager.addTransitions(initialID, [{
				trigger: Trigger.trigger1,
				rel: Relation.child,
				enter,
				exit,
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
				enter,
				exit,
			}]);
			manager.trigger(Trigger.trigger1);
			expect(manager.current).toBe(destState);
			expectArgsToBeCorrect();
		});
		it("Relation.sibling", (): void => {
			const parent = createState('parent');
			const parentID = manager.add(parent);
			manager.appendChildren(parentID, [initialID, destID]);
			manager.addTransitions(initialID, [{
				trigger: Trigger.trigger1,
				rel: Relation.sibling,
				enter,
				exit,
			}]);

			manager.trigger(Trigger.trigger1);
			expect(manager.current).toBe(destState);
			expectArgsToBeCorrect();
		});

		describe("Relation.siblingElseUp", (): void => {
			it("to a sibling (if extant)", (): void => {
				const parent = createState('parent');
				const parentID = manager.add(parent);
				manager.appendChildren(parentID, [initialID, destID]);
				manager.addTransitions(initialID, [{
					trigger: Trigger.trigger1,
					rel: Relation.siblingElseUp,
					enter,
					exit,
				}]);

				manager.trigger(Trigger.trigger1);
				expect(manager.current).toBe(destState);
				expectArgsToBeCorrect();
			});
			it("to the parent (if no more siblings)", (): void => {
				const parent = createState('parent');
				const parentID = manager.add(parent);
				// There are siblings, but initial is the *last*.
				manager.appendChildren(parentID, [destID, initialID]);
				manager.addTransitions(initialID, [{
					trigger: Trigger.trigger1,
					rel: Relation.siblingElseUp,
					enter,
					exit,
				}]);

				manager.trigger(Trigger.trigger1);
				expect(manager.current).toBe(parent);
				expectArgsToBeCorrect(parent);
			});
		});
	});
});
