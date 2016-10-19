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


export interface ManagerOptions<Category, Data> {
	metadata: (category: Category, data: Data) => any;
}


export interface BatchOptionsBase {
	name?: string;
	limit?: number;
}


export interface HasSingleContext {
	context: any;
}


export interface HasMultipleContexts {
	contexts: any;
}


export type BatchOptions = BatchOptionsBase & (
	HasSingleContext | HasMultipleContexts
);


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
	batch(
		items: [Category, Handler<Category, Data>][],
		options?: BatchOptions
	)
		: symbol
	{
		let getContext: (i: number) => any;
		if (options === undefined) {
			options = <BatchOptions> {};
			getContext = (i: number): any => null;
		}
		else if (options.hasOwnProperty('context')) {
			console.assert(
				(<HasMultipleContexts> options).contexts === undefined,
				"Batch request has 'context' and 'contexts' properties"
			);
			getContext = (i: number): any =>
				(<HasSingleContext> options).context;
		}
		else if (options.hasOwnProperty('contexts')) {
			getContext = (i: number): any =>
				(<HasMultipleContexts> options).contexts[i];
		}

		const batchID: symbol = Symbol(options!.name);
		const batched: HandlerInfo[] = items.map((
			a: [Category, Handler<Category, Data>],
			i: number
		)
			: HandlerInfo =>
		{
			const info = <BatchedHandlerInfo> this.addHandler(
				a[0],
				a[1],
				getContext(i),
				options!.limit
			);
			info.bat = batchID;
			return info;
		});
		this.batches.set(batchID, batched);
		return batchID
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
