import {combine as hashCombine} from './util/hash';
import {noop} from './util/misc';


export interface Event<Category, Data> {
	/** The category of this event. */
	category: Category;
	/** Event data. */
	data: Data;
	/** Event metadata. Useful for debugging. */
	meta: any;
}


/** A function which can be used to listen to events. */
export interface Handler<Category, Data> {
	(ev: Event<Category, Data>): void;
}


type CategoryHandlers = Map<string, HandlerInfo>;


interface HandlerInfo {
	/** The handler function. */
	fn: Handler<any, any>;
	/** The handler context. */
	ctx: any;
	/** The handler identifier. */
	id: string;
	/** Whether this handler is active. */
	on: boolean;
	/** A numerical limit on the number of times this handler can be called. */
	max: number;
}


export interface ManagerOptions<Category, Data> {
	metadata: (category: Category, data: Data) => any;
}


export class Manager<Category, Data> {
	private handlers: Map<Category, CategoryHandlers> = new Map();

	private metadata: (category: Category, data: Data) => any;

	constructor(options?: ManagerOptions<Category, Data>) {
		this.metadata = (options && options.metadata) || noop;
	}

	/**
	 * Add an event handler for a particular category.
	 *
	 * @param category - the category of events to listen to.
	 * @param handler - the event handler.
	 * @param context - the optional context for the handler to be called with.
	 * @param limit - the maximum number of times to call the handler.
	 */
	on(
		category: Category,
		handler: Handler<Category, Data>,
		context?: any,
		limit: number = Infinity
	)
		: this
	{
		let handlers: CategoryHandlers|undefined = this.handlers.get(category);
		if (!handlers) {
			this.handlers.set(category, handlers = new Map());
		}

		const id: string = hashCombine(handler, context);
		(<CategoryHandlers> handlers).set(id, {
			fn: handler,
			ctx: context,
			id: id,
			on: true,
			max: limit
		});
		return this;
	}

	/**
	 * Add an event handler for a particular category, to be called once only.
	 *
	 * @param category - the category of events to listen to.
	 * @param handler - the event handler.
	 * @param context - the optional context for the handler to be called with.
	 */
	once(category: Category, handler: Handler<Category, Data>, context?: any)
		: this
	{
		return this.on(category, handler, context, 1);
	}

	/**
	 * Cancel a previously-set event handler.
	 *
	 * @param category - the category of events being listened to.
	 * @param handler - the event handler.
	 * @param context - the optional context for the handler to be called with.
	 */
	off(category: Category, handler: Handler<Category, Data>, context?: any)
		: this
	{
		const handlers: CategoryHandlers|undefined =
			this.handlers.get(category);
		if (handlers) {
			(<CategoryHandlers> handlers).delete(
				hashCombine(handler, context)
			);
		}
		return this;
	}

	/** Cancel all event handlers. */
	clear(): this {
		this.handlers.clear();
		return this;
	}

	/**
	 * Fire an event.
	 *
	 * @param category - the event category.
	 * @param ev - the event to fire.
	 */
	fire(category: Category, data: Data): this {
		const handlers: CategoryHandlers|undefined =
			this.handlers.get(category);

		if (!handlers) {
			return this;
		}

		const ev: Event<Category, Data> = {
			category: category,
			data: data,
			meta: this.metadata(category, data)
		};
		let iter: IterableIterator<HandlerInfo> = handlers.values();
		let res: IteratorResult<HandlerInfo> = iter.next();
		while (!res.done) {
			res.value.fn.call(res.value.ctx, ev);
			if (--res.value.max <= 0) {
				handlers.delete(res.value.id);
			}
			res = iter.next();
		}
		return this;
	}
}
