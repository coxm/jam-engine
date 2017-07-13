import {combine as hashCombine} from 'jam/util/hash';
import {noop} from 'jam/util/misc';


export interface Event<Category, Data> {
	/** The category of this event. */
	readonly category: Category;
	/** Event data. */
	readonly data: Data;
	/** Event metadata. Useful for debugging. */
	readonly meta: any;
}


/** A function which can be used to listen to events. */
export interface Handler<Category, Data> {
	(ev: Event<Category, Data>): void;
}


export interface HandlerOptions {
	readonly limit?: number;
	readonly context?: any;
}


export interface BatchDefaults extends HandlerOptions {
	readonly id?: symbol;
}


export type OptionsHandlerItem<Category, Data> = [
	Category,
	Handler<Category, Data>,
	HandlerOptions
];


export type HandlerItem<Category, Data> = (
	[Category, Handler<Category, Data>] |
	OptionsHandlerItem<Category, Data>
);


export interface ManagerOptions<Category, Data> {
	metadata: (category: Category, data: Data) => any;
}


interface HandlerInfo {
	cat: any;
	/** The handler function. */
	fn: Handler<any, any>;
	/** The handler context. */
	ctx: any;
	/** The handler identifier. */
	id: string;
	/** A numerical limit on the number of times this handler can be called. */
	max: number;
}


interface BatchedHandlerInfo extends HandlerInfo {
	bat: symbol;
}


type CategoryHandlers = Map<string, HandlerInfo>;


/**
 * Events manager.
 *
 * @tparam Category a type indicating the available event categories. Strings
 * allow more flexibility, but enums or symbols can also be used.
 * @tparam Data a type indicating what kind of data is stored on events.
 *
 * An object which deals with game events. Typically a single `Manager`
 * instance will suffice, but multiple instances can be constructed as well.
 * Each `Manager` has multiple event streams to which listeners can be added
 * (and subsequently removed). The `Manager` also supports batches of
 * listeners, which can be added/removed in a single operation.
 *
 * The {@link Manager} class can set event handlers using the
 * {@link Manager#on} and {@link Manager#once} methods. Optionally a context
 * can be passed to both methods, and a numeric limit can be passed to
 * {@link Manager#on}.
 *
 * @example <caption>Simple event handlers</caption>
 * const manager = new Manager<string, any>();
 * manager
 *     .on('SomeEvent', (event): void => {
 *         console.log('This will be called every time SomeEvent happens');
 *     })
 *     .once('SomeEvent', (event): void => {
 *         console.log('This will be called at most once');
 *     })
 *     .on('SomeEvent', function(event): void {
 *         console.log(this.whatami, 'observed SomeEvent');
 *     }, {whatami: 'The context'})
 *     .on('SomeEvent', (event): void => {
 *         console.log('This will be called at most 5 times');
 *     }, null, 5);
 *
 * Any handler set using {@link Manager#on} or {@link Manager#once} can also be
 * cancelled using the {@link Manager#off} method. When a context is used by a
 * handler, that same context is required for removal.
 *
 * @example <caption>Cancelling event handlers</caption>
 * const manager = new Manager<string, any>();
 * const context = {whatami: 'The context'};
 * function handler(ev: Event): void {
 *     // Do something...
 * }
 * manager
 *     .on('SomeEvent', handler)
 *     .on('AnotherEvent', handler, context);
 * // To cancel:
 * manager
 *     .off('SomeEvent', handler)
 *     .off('AnotherEvent', handler, context);
 *
 * Event handlers can be grouped together in "batches" using the
 * {@link Manager#batch} method. This is especially convenient for specifying
 * lots of complex behaviour which must also be removed simultaneously (for
 * example, clearing all listeners set by a level). Batches are then removed by
 * calling the {@link Manager#unbatch} method with the batch ID.
 *
 * @example <caption>Batching event handlers</caption>
 * const manager = new Manager<string, any>();
 * const context = {whatami: 'The context'};
 * function handler(this: {whatami: string;}, event): void {
 *     let message = ${event.type} + ' happened';
 *     if (this.whatami) {
 *         message += ' as observed by ' + this.whatami;
 *     );
 *     console.log(message);
 * }
 * // Initialise the batch, e.g. when starting a level:
 * const batchID = manager.batch([
 *     ['SomeEvent', handler],
 *     // ...
 * ], {ctx: context});
 * // Remove the entire batch, e.g. when ending a level:
 * manager.unbatch(batchID);
 *
 * For convenience, the batch ID can be specified on construction. Calling
 * {@link Manager#batch} with an ID will add handlers to the batch if it
 * exists, or create a new one if not.
 *
 * @example <caption>Extending batches</caption>
 * const manager = new Manager<string, any>();
 * const batchID = Symbol('MyHandlerBatch');
 * const handler = (event) => { console.log(event.type, 'happened!'); };
 * manager.batch([
 *     ['SomeEvent', handler],
 *     // ...
 * ], {id: batchID});
 * // Add an 'AnotherEvent' handler to the same batch.
 * manager.batch([
 *     ['AnotherEvent', handler],
 *     // ...
 * ], {id: batchID});
 * // Remove all batched handlers.
 * manager.unbatch(batchID);
 */
export class Manager<Category, Data> {
	/**
	 * The event handlers, in a Category -> CategoryHandlers map.
	 *
	 * Access an event handler via `handlers.get(category).get(hash)`, where
	 * `hash` is the combined hash of the handler and its context.
	 */
	private handlers: Map<Category, CategoryHandlers>;

	/**
	 * Related handlers, batched together by a unique symbol.
	 *
	 * @see {@link Manager#batch}.
	 */
	private batches: Map<symbol, HandlerInfo[]>;

	private metadata: (category: Category, data: Data) => any;

	constructor(options?: ManagerOptions<Category, Data>) {
		this.handlers = new Map();
		this.batches = new Map();
		this.metadata = (options && options.metadata) || noop;
	}

	/**
	 * Add an event handler for a particular category.
	 *
	 * @param category - the category of events to listen to.
	 * @param handler - the event handler.
	 * @param context - the optional context for the handler to be called with.
	 * @param limit - the maximum number of times to call the handler; defaults
	 * to `Infinity`.
	 */
	on(
		category: Category,
		handler: Handler<Category, Data>,
		context?: any,
		limit?: number
	)
		: this
	{
		this.addHandler(category, handler, context, limit);
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

	/**
	 * Add a batch of event handlers.
	 *
	 * The handlers involved can be removed individually or in one operation.
	 * @see {@link Manager#unbatch}.
	 *
	 * @param items - the categories and corresponding handlers.
	 * @param options - options for configuring the batch.
	 * @param options.id - an ID for an existing batch. If necessary a new
	 * batch is created.
	 * @param options.limit - an optional default for the number of times
	 * handlers in this batch will be called.
	 * @param options.context - an optional default context.
	 * @returns a unique ID for the batch, which can be used to remove all
	 * handlers involved.
	 */
	batch(items: HandlerItem<Category, Data>[], defaults?: BatchDefaults)
		: symbol
	{
		defaults = Object.assign({
			limit: Infinity,
			context: null,
		}, defaults);
		const batchID: symbol = defaults!.id || Symbol();

		let batched: HandlerInfo[] | undefined = this.batches.get(batchID);
		if (!batched) {
			batched = [];
			this.batches.set(batchID, batched);
		}
		for (const item of items) {
			const options = (
				<[Category, Handler<Category, Data>, HandlerOptions]> item
			)[2];
			const info = <BatchedHandlerInfo> this.addHandler(
				item[0], // Category.
				item[1], // Handler.
				(options && options.context) || defaults!.context,
				(options && options.limit) || defaults!.limit
			);
			info.bat = batchID;
			batched.push(info);
		}
		return batchID;
	}

	/**
	 * Remove all handlers within a batch.
	 *
	 * @param id - the ID returned when the batch was created.
	 */
	unbatch(id: symbol): this {
		const batched: HandlerInfo[] | undefined = this.batches.get(id);
		if (batched !== undefined) {
			for (const info of batched) {
				this.off(info.cat, info.fn, info.ctx);
			}
			this.batches.delete(id);
		}
		return this;
	}

	/**
	 * Check if a batch is registered.
	 *
	 * @param id - the ID returned when the batch was created.
	 */
	hasBatch(id: symbol): boolean {
		return this.batches.has(id);
	}

	/** Cancel all event handlers. */
	clear(): this {
		this.handlers.clear();
		this.batches.clear();
		return this;
	}

	/**
	 * Fire an event.
	 *
	 * @param category - the event category.
	 * @param ev - the event to fire.
	 */
	fire<EventData extends Data>(category: Category, data: EventData): this {
		const handlers: CategoryHandlers|undefined =
			this.handlers.get(category);

		if (!handlers) {
			return this;
		}

		const ev: Event<Category, EventData> = {
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

	private addHandler(
		category: Category,
		handler: Handler<Category, Data>,
		context?: any,
		limit?: number
	)
		:	HandlerInfo
	{
		let handlers: CategoryHandlers|undefined = this.handlers.get(category);
		if (!handlers) {
			this.handlers.set(category, handlers = new Map());
		}
		const id: string = hashCombine(handler, context);
		const info: HandlerInfo = {
			cat: category,
			fn: handler,
			ctx: context,
			id: id,
			max: typeof limit === 'number' ? limit : Infinity,
		};
		(<CategoryHandlers> handlers).set(id, info);
		return info;
	}
}
