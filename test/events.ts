import {Manager, Event} from 'jam/events';


type TestEvent = Event<string, number>;


interface Context {
	value: number;
}


describe("events.Manager", (): void => {
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
})
