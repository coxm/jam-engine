import * as events from 'jam/events/Manager';
import * as triggers from 'jam/events/triggers';


interface EventData {
}


type Category = string;
type Event = events.Event<Category, EventData>;
type Action = triggers.Action<Event>;
type Predicate = triggers.Predicate<Event>;
type Factory = triggers.Factory<Category, EventData>;
type Context = triggers.Context<Category, EventData>;
type TriggerDef = triggers.TriggerDef<Category>;
type LinearTriggerDef = triggers.LinearTriggerDef<Category>;
type SwitchTriggerDef = triggers.SwitchTriggerDef<Category>;


describe("Trigger Factory", (): void => {
	let factory: Factory;

	function makeEvent(ev?: Partial<Event>): Event {
		const data = {};
		const meta = {};
		let category: string = 'Category';
		if (ev) {
			Object.assign(data, ev.data);
			Object.assign(meta, ev.meta);
			if (ev.category) {
				category = ev.category
			}
		}

		return {category, data, meta};
	}

	beforeEach((): void => {
		factory = new triggers.Factory<Category, EventData>();
	});

	describe("action method", (): void => {
		it("throws if the action hasn't been defined", (): void => {
			expect((): void => {
				factory.action({do: 'not defined'});
			}).toThrow();
		});
		it("constructs an action accordingly", (): void => {
			const actionType = 'ActionType';

			let callCount = 0;

			factory.addActionFactory(actionType, (): Action => {
				return (): void => {
					++callCount;
				};
			});

			const action = factory.action({do: actionType});
			action(makeEvent());
			expect(callCount).toBe(1);
		});
	});

	describe("predicate method", (): void => {
		it("throws if the predicate hasn't been defined", (): void => {
			expect((): void => {
				factory.predicate({pred: 'not defined'});
			}).toThrow();
		});
		it("constructs a predicate accordingly", (): void => {
			const predType = 'PredicateType';
			let value = false;
			factory.addPredicateFactory(predType, (): Predicate => {
				return (): boolean => value;
			});

			const predicate = factory.predicate({pred: predType});
			expect(predicate(makeEvent())).toBe(value);

			value = true;
			expect(predicate(makeEvent())).toBe(value);
		});
	});

	describe("makeContext method, when", () => {
		let thenCount = 0;
		let elseCount = 0;
		let predCount = 0;
		let predicateReturnValue = false;

		beforeEach((): void => {
			thenCount = 0;
			elseCount = 0;
			predCount = 0;
			predicateReturnValue = false;

			function thenAction(): void {
				++thenCount;
			}

			function elseAction(): void {
				++elseCount;
			}

			factory.addActionFactory('MyAction', () => thenAction);
			factory.addActionFactory('MyOtherAction', () => elseAction);

			function predicate(): boolean {
				++predCount;
				return predicateReturnValue;
			}
			factory.addPredicateFactory('pred', () => predicate);
		});

		describe("given a linear trigger, returns a context that", () => {
			it("always runs if the 'if' field is empty", () => {
				const def: LinearTriggerDef = {
					on: 'category',
					then: {do: 'MyAction'},
				};
				const context: Context = factory.makeContext(def);
				context.trigger(makeEvent());
				expect(thenCount).toBe(1);
				expect(elseCount).toBe(0);
			});
			it("that allows null 'then' actions", () => {
				predicateReturnValue = true;
				const def: LinearTriggerDef = {
					on: 'category',
					if: {pred: 'pred'},
				};
				const context: Context = factory.makeContext(def);
				context.trigger(makeEvent());
				expect(predCount).toBe(1);
			});
			it("that allows null 'else' actions", () => {
				predicateReturnValue = false;
				const def: LinearTriggerDef = {
					on: 'category',
					if: {pred: 'pred'},
				};
				const context: Context = factory.makeContext(def);
				context.trigger(makeEvent());
				expect(predCount).toBe(1);
			});
			it("that uses the 'then' action where appropriate" , () => {
				predicateReturnValue = true;
				const def: LinearTriggerDef = {
					on: 'category',
					if: {pred: 'pred'},
					then: {do: 'MyAction'},
					else: {do: 'MyOtherAction'},
				};
				const context: Context = factory.makeContext(def);
				context.trigger(makeEvent());
				expect(predCount).toBe(1);
				expect(thenCount).toBe(1);
				expect(elseCount).toBe(0);
			});
			it("that uses the 'else' action where appropriate" , () => {
				predicateReturnValue = false;
				const def: LinearTriggerDef = {
					on: 'category',
					if: {pred: 'pred'},
					then: {do: 'MyAction'},
					else: {do: 'MyOtherAction'},
				};
				const context: Context = factory.makeContext(def);
				context.trigger(makeEvent());
				expect(predCount).toBe(1);
				expect(thenCount).toBe(0);
				expect(elseCount).toBe(1);
			});
		});

		describe("given a switch trigger, returns a context that", () => {
			const propKey = 'prop';
			let actionCounts = {
				a: 0,
				b: 0,
				c: 0,
				else: 0,
			};
			let def: SwitchTriggerDef;

			beforeEach((): void => { // Super verbose, but simple.
				actionCounts = {
					a: 0,
					b: 0,
					c: 0,
					else: 0,
				};

				def = {
					on: 'category',
					key: propKey,
					switch: [
						{if: 'a', then: {do: 'ActionA'}},
						{if: 'b', then: {do: 'ActionB'}},
						{if: 'c', then: {do: 'ActionC'}},
					],
				};

				const actionA = (): void => { ++actionCounts.a; };
				const actionB = (): void => { ++actionCounts.b; };
				const actionC = (): void => { ++actionCounts.c; };
				const actionElse = (): void => { ++actionCounts.else; };

				factory.addActionFactory('ActionA', () => {
					return actionA;
				});
				factory.addActionFactory('ActionB', () => {
					return actionB;
				});
				factory.addActionFactory('ActionC', () => {
					return actionC;
				});
				factory.addActionFactory('ActionElse', () => {
					return actionElse;
				});
			});

			it("calls the action of the matching case", () => {
				const context: Context = factory.makeContext(def);
				context.trigger(makeEvent({
					data: {
						[propKey]: 'a'
					}
				}));
				expect(actionCounts).toEqual({
					a: 1,
					b: 0,
					c: 0,
					else: 0,
				});
			});
			it("calls the default if no such value is found", () => {
				def = Object.assign({}, def, {
					else: {do: 'ActionElse'},
				});

				const context: Context = factory.makeContext(def);
				context.trigger(makeEvent({
					data: {
						[propKey]: 'd',
					},
				}));
				expect(actionCounts).toEqual({
					a: 0,
					b: 0,
					c: 0,
					else: 1,
				});
			});
			it("does nothing if no default and no such value found", () => {
				const context: Context = factory.makeContext(def);
				context.trigger(makeEvent({
					data: {
						[propKey]: 'd',
					},
				}));
				expect(actionCounts).toEqual({
					a: 0,
					b: 0,
					c: 0,
					else: 0,
				});
			});
		});
	});

	describe("interfaces with event managers, providing the", () => {
		const category = 'category';
		const propKey = 'action';
		const actionID = 'ActionID';
		let manager: events.Manager<Category, EventData>;

		beforeEach((): void => { // Super verbose, but simple.
			manager = new events.Manager<Category, EventData>();
		});

		describe("handler method which", () => {
			let def: LinearTriggerDef;
			let callCount = 0;

			beforeEach((): void => {
				callCount = 0;

				const action = (): void => { ++callCount; };

				factory.addActionFactory(actionID, () => {
					return action;
				});

				def = {
					on: category,
					then: {do: actionID},
				};
			});

			it("triggers the appropriate action on events", () => {
				const [cat, handler, options] = factory.handler(def);
				manager.on(cat, handler, options.context, options.limit);
				manager.fire(category, {
					[propKey]: actionID,
				});
				expect(callCount).toBe(1);
			});
			it("respects the requested limit, if given", () => {
				def = Object.assign({}, def, {
					limit: 1,
				});
				const [cat, handler, options] = factory.handler(def);
				manager.on(cat, handler, options.context, options.limit);
				manager.fire(category, {
					[propKey]: actionID,
				});
				manager.fire(category, {
					[propKey]: actionID,
				});
				expect(callCount).toBe(1);
			});
		});

		describe("batch method which", () => {
			const category1 = 'category1';
			const category2 = 'category2';
			const actionAID = 'actionAID';
			const actionBID = 'actionBID';
			const actionCID = 'actionCID';

			let defs: TriggerDef[];
			let actionCounts = {
				a: 0,
				b: 0,
				c: 0,
			};

			beforeEach((): void => {
				defs = [
					{
						on: category1,
						then: {do: actionAID},
					},
					{
						on: category1,
						then: {do: actionBID},
					},
					{
						on: category2,
						then: {do: actionCID},
					}
				];

				actionCounts = {
					a: 0,
					b: 0,
					c: 0,
				};

				const actionA = (): void => { ++actionCounts.a; };
				const actionB = (): void => { ++actionCounts.b; };
				const actionC = function(this: {uses: number}): void {
					++actionCounts.c;
					++this.uses;
				};
				factory.addActionFactory(actionAID, () => actionA);
				factory.addActionFactory(actionBID, () => actionB);
				factory.addActionFactory(actionCID, () => actionC);
			});

			it("triggers the appropriate actions on events", () => {
				manager.batch(factory.batch(defs));
				manager.fire(category1, {});
				expect(actionCounts).toEqual({
					a: 1,
					b: 1,
					c: 0,
				});
			});
			it("respects requested specific limits, if given", () => {
				defs[1] = Object.assign({}, defs[1], {limit: 1});
				manager.batch(factory.batch(defs));
				manager.fire(category1, {});
				manager.fire(category1, {});
				expect(actionCounts).toEqual({
					a: 2,
					b: 1,
					c: 0,
				});
			});
		});
	});
});
