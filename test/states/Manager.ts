import {Manager, ManagedState as State, Alias} from 'jam/states/Manager';


enum Trigger {
	trigger1,
}


const defaults: State = {
	start(this: State): Promise<void> {
		return (<any> this)._startPromise || (
			(<any> this)._startPromise = Promise.resolve()
		);
	},
	end(this: State): void {
	},
	attach(this: State): void {
	},
	detach(this: State): void {
	},
};


function createState(proto?: {
	start?: () => Promise<void>;
	end?: () => void;
	attach?: () => void;
	detach?: () => void;
})
	: State
{
	return Object.assign({}, defaults, proto);
}


function createManager(): Manager<State, Trigger> {
	return new Manager<State, Trigger>();
}


describe("Manager start method", (): void => {
	it("starts the state", (done): void => {
		const state = createState();
		spyOn(state, 'start').and.callThrough();
		const manager = createManager();
		const id = manager.add(state);
		manager.start(id).then((): void => {
			expect(state.start).toHaveBeenCalledTimes(1);
			done();
		});
	});
	it("throws if the manager has no such state", (): void => {
		expect((): void => {
			createManager().start('not a state');
		}).toThrow();
	});
	it("throws if the manager has already been started", (): void => {
		const state = createState();
		const manager = createManager();
		const id = manager.add(state);
		manager.start(id);
		expect((): void => {
			manager.start(id);
		}).toThrow();
	});
});


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
			});
		});
	});
}


describe("Manager add method", (): void => {
	let manager: Manager<State, Trigger>;

	beforeEach((): void => {
		manager = createManager();
	});

	describe("adds a state which can be", (): void => {
		let state: State;
		let id: number;

		beforeEach((): void => {
			state = createState();
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
			const parent = createState();
			const child = createState();
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
			const child = createState();
			const parent = createState();
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
			const child = createState();
			const parent = createState();
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
