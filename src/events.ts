import {combine as hashCombine} from './util/hash';
import {noop} from './util/misc';


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


export type BatchDefaults = HandlerOptions & (
	{readonly name?: string} |
	{readonly id: symbol}
);


export type HandlerItem<Category, Data> = (
	[Category, Handler<Category, Data>] |
	[Category, Handler<Category, Data>, HandlerOptions]
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
	 * @returns a unique ID for the batch, which can be used to remove all
	 * handlers involved.
	 */
	batch(items: HandlerItem<Category, Data>[], defaults?: BatchDefaults)
		: symbol
	{
		defaults = Object.assign({
			limit: Infinity,
			context: null,
			name: '',
		}, defaults);
		const batchID: symbol = (<{id: symbol}> defaults).id ||
			Symbol((<{name?: string}> defaults).name);

		let batched: HandlerInfo[] | undefined = this.batches.get(batchID);
		if (!batched) {
			batched = [];
			this.batches.set(batchID, batched);
		}
		for (let item of items) {
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
			for (let info of batched) {
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
