import {Manager, Event} from 'jam/events';


type TestEvent = Event<string, number>;


interface Context {
	value: number;
}


describe("Event manager", (): void => {
	const manager: Manager<string, number> = new Manager<string, number>();

	describe("on method", (): void => {
		it("sets handlers for that category", (): void => {
			let value: number = 0;
			manager.on('category', (ev: TestEvent): void => {
				value = ev.data;
			});
			manager.fire('category', 0xf00d);
			expect(value).toBe(0xf00d);
		})
		it("only sets handlers for a single category", (): void => {
			let value: number = 0xdead
			manager.on('this', (ev: TestEvent): void => {
				value = ev.data;
			});
			manager.fire('that', 0xf00d);
			expect(value).toBe(0xdead);
		})
		it("can set a context for handlers", (): void => {
			const context: Context = { value: 0xdead };
			function handler(this: Context, ev: TestEvent): void {
				this.value = ev.data;
			}
			manager.on('category', handler, context);
			manager.fire('category', 0xf00d);
			expect(context.value).toBe(0xf00d);
		})
		it("can limit the number of times a handler is called", (): void => {
			const limit: number = 3;
			let value: number = 0;
			manager.on('category', (ev: TestEvent): void => {
				value = ev.data;
			}, null, limit);

			for (let i: number = 0; i < limit; ++i) {
				manager.fire('category', i);
				expect(value).toBe(i);
			}
			manager.fire('category', limit);
			expect(value).toBe(limit - 1);
		});
	})

	describe("once method", (): void => {
		it("sets a one-time event handler", (): void => {
			let value: number = 0xdead;
			manager.once('category', (ev: TestEvent): void => {
				value = ev.data;
			});
			manager.fire('category', 1);
			expect(value).toBe(1);
			manager.fire('category', 2);
			expect(value).toBe(1);
		})
	})

	describe("off method", (): void => {
		it("cancels existing handlers", (): void => {
			let callCount: number = 0;
			function handler(ev: TestEvent): void {
				++callCount;
			}
			manager.on('category', handler);
			manager.off('category', handler);
			manager.fire('category', 1);
			expect(callCount).toBe(0);
		})
		it("does nothing for nonexistent handlers", (): void => {
			expect((): void => {
				manager.off('nope', (): void => {});
			}).not.toThrow();
		})
		it("doesn't cancel handlers with different contexts", (): void => {
			function handler(this: Context, ev: TestEvent): void {
				this.value = ev.data;
			}
			const category: string = 'category';
			const context1: Context = { value: 1 };
			const context2: Context = { value: 2 };
			manager.on(category, handler, context1);
			manager.on(category, handler, context2);
			manager.off(category, handler, context2);
			manager.fire(category, 3);
			expect(context1.value).toBe(3);
			expect(context2.value).toBe(2);
		})
	})

	describe("batch method", (): void => {
		const category = 'SomeEvent';
		let value: number = 0;
		let callCount: number = 0;
		const handler = (ev: TestEvent): void => {
			value = ev.data;
			++callCount;
		};

		beforeEach((): void => {
			value = 0;
			callCount = 0;
		});

		it("adds the batch", (): void => {
			const id = manager.batch([[category, handler]]);
			expect(manager.hasBatch(id)).toBe(true);
		});
		it("registers event handlers", (): void => {
			const expected: number = 4;
			manager.batch([
				[category, handler]
			]);
			manager.fire(category, expected);
			expect(value).toBe(expected);
			expect(callCount).toBe(1);
		});
		it("can extend existing batches", (): void => {
			const expected: number = 4;
			const id = manager.batch([]);
			const returned = manager.batch([[category, handler]], {id});
			manager.fire(category, expected);
			expect(callCount).toBe(1);
			expect(returned).toBe(id);
		});
		it("returns a cancelling ID", (): void => {
			const expected: number = value;
			const id = manager.batch([
				[category, handler]
			]);
			manager.unbatch(id);
			manager.fire(category, 1337);
			expect(value).toBe(expected);
		});

		it("respects default limits", (): void => {
			manager.batch(
				[[category, handler]],
				{limit: 1}
			);
			expect(callCount).toBe(0);
			manager.fire(category, 4);
			expect(callCount).toBe(1);
			manager.fire(category, 4);
			expect(callCount).toBe(1);
		});
		it("respects default contexts", (): void => {
			const defaultContext: Context = {value: 0};
			const expectedValue = 4;
			manager.batch([
				[category, function(this: Context, ev: TestEvent): void {
					this.value = ev.data;
				}]
			], {context: defaultContext});
			manager.fire(category, expectedValue);
			expect(defaultContext.value).toBe(expectedValue);
		});

		it("prioritises specific limits", (): void => {
			manager.batch([
				[category, handler, {limit: 2}]
			], {limit: 1});
			manager.fire(category, 4);
			manager.fire(category, 4);
			expect(callCount).toBe(2);
		});
		it("prioritises specific contexts", (): void => {
			const specificContext: Context = {value: 0};
			const defaultContext: Context = {value: 0};

			function func(this: Context): void {
				++this.value;
			}

			manager.batch([
				[category, func, {context: specificContext}]
			], {context: defaultContext});
			manager.fire(category, 4);
			expect(specificContext.value).toBe(1);
			expect(defaultContext.value).toBe(0);
		});

		it("combines specific & default limits", (): void => {
			const defaultLimit: number = 1;
			const specificLimit: number = 2;

			let controlCallCount: number = 0;
			function controlHandler(): void {
				++controlCallCount;
			}

			manager.batch([
				[category, handler, {limit: specificLimit}],
				[category, controlHandler]
			], {limit: defaultLimit});

			manager.fire(category, 4);
			manager.fire(category, 4);
			manager.fire(category, 4);

			expect(callCount).toBe(specificLimit);
			expect(controlCallCount).toBe(defaultLimit);
		});
		it("combines specific & default contexts", (): void => {
			const defaultContext: Context = {value: 0};
			const specificContext: Context = {value: 0};

			function func(this: Context): void {
				++this.value;
			}

			manager.batch([
				[category, func, {context: specificContext}],
				[category, func]
			], {context: defaultContext});

			manager.fire(category, 4);
			expect(specificContext.value).toBe(1);
			expect(defaultContext.value).toBe(1);
		});

		it("accepts multiple event types", (): void => {
			const otherCategory = 'SomeOtherEvent';
			let otherCount = 0;

			manager.batch([
				[category, handler],
				[otherCategory, (): void => { ++otherCount; }]
			]);

			manager.fire(category, 4);
			expect(callCount).toBe(1);
			expect(otherCount).toBe(0);

			manager.fire(otherCategory, 4);
			expect(callCount).toBe(1);
			expect(otherCount).toBe(1);
		});
	});

	describe("unbatch method", (): void => {
		it("removes the batch", (): void => {
			let called = false;
			const category = 'SomeEvent';
			const id = manager.batch([
				[category, (): void => { called = true; }]
			]);
			manager.unbatch(id);
			expect(manager.hasBatch(id)).toBe(false);

			manager.fire(category, 4);
			expect(called).toBe(false);
		});
		it("fails silently if the id is invalid", (): void => {
			expect((): void => {
				manager.unbatch(Symbol('Not a valid ID'));
			}).not.toThrow();
		});
	});

	describe("clear method", (): void => {
		const category = 'SomeEvent';
		let callCount: number = 0;
		const handler = (): void => {
			++callCount;
		};

		beforeEach((): void => {
			callCount = 0;
		});

		it("removes all handlers", (): void => {
			manager.on(category, handler);
			manager.clear();
			manager.fire(category, 4);
			expect(callCount).toBe(0);
		});
		it("removes all batched handlers", (): void => {
			manager.batch([[category, handler]]);
			manager.clear();
			manager.fire(category, 4);
			expect(callCount).toBe(0);
		});
		it("clears the batch collection", (): void => {
			const id = manager.batch([[category, handler]]);
			manager.clear();
			expect(manager.hasBatch(id)).toBe(false);
		});
	});
})
