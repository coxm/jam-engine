import {noop} from '../util/misc';


export interface StateOptions {
	/** The State's name. */
	name: string;
}


export const enum StateFlags {
	none = 0,
	preloaded = 1,
	initialised = 2,
	running = 4,
	attached = 8,
	paused = 16,
}


export const enum StateEventType {
	preloadBegin,
	preloadEnd,
	unloading,
	initDone,
	deiniting,
	starting,
	stopping,
	pausing,
	unpausing,
	attaching,
	detaching,
}


export interface StateEvent<T> {
	state: State;
	data?: T;
}


/**
 * Basic state class.
 *
 * States can be executed linearly or as tree nodes (or both). Basic behaviour
 * is injected by subclassing and overriding certain methods.
 */
export class State {
	static onEvent: (type: StateEventType, ev: StateEvent<any>) => void = noop;

	private preloaded: Promise<any> | null = null;
	private initialised: Promise<any> | null = null;

	protected flags: number = StateFlags.none;

	constructor(readonly name: string) {
	}

	get isPreloaded(): boolean {
		return 0 !== (this.flags & StateFlags.preloaded);
	}

	get isInitialised(): boolean {
		return 0 !== (this.flags & StateFlags.initialised);
	}

	get isAttached(): boolean {
		return 0 !== (this.flags & StateFlags.attached);
	}

	get isRunning(): boolean {
		return 0 !== (this.flags & StateFlags.running);
	}

	get isPaused(): boolean {
		return 0 !== (this.flags & StateFlags.paused);
	}

	/** Fetch any data required to initialise. */
	preload(): Promise<any> {
		if (this.preloaded) {
			return this.preloaded;
		}
		State.onEvent(StateEventType.preloadBegin, {state: this});
		return this.preloaded = Promise.resolve(this.doPreload()).then(
			<Data>(data: Data): Data => {
				State.onEvent(StateEventType.preloadEnd, {
					state: this,
					data: data,
				});
				this.flags |= StateFlags.preloaded;
				return data;
			}
		);
	}

	/** Destroy any raw preloaded assets. */
	unload(): void {
		this.preloaded = null;
		this.flags &= ~StateFlags.preloaded;
	}

	/**
	 * Initialise this state.
	 *
	 * Preloads state data if not already loaded.
	 *
	 * @returns a promise which resolves when the state has preloaded and
	 * initialised.
	 */
	init(): Promise<void> {
		return this.initialised || (this.initialised = this.preload().then(
			this._init.bind(this)
		));
	}

	/** Undo initialisation. */
	deinit(): void {
		this.stop();
		State.onEvent(StateEventType.deiniting, {state: this});
		this.doDeinit();
		this.flags &= ~StateFlags.initialised;
	}

	/** Unload and de-initialise this state. */
	destroy(): void {
		this.stop();
		this.unload();
		this.deinit();
	}

	/**
	 * Start this state.
	 *
	 * Initialises via {@link init} before starting.
	 */
	start(): Promise<void> {
		return this.init().then(this._start.bind(this));
	}

	/** Stop this state. */
	stop(): void {
		if (this.flags & StateFlags.running) {
			State.onEvent(StateEventType.stopping, {state: this});
			this.doStop();
			this.flags &= ~StateFlags.running;
		}
	}

	/** Pause this state. */
	pause(): void {
		if (!(this.flags & StateFlags.paused)) {
			State.onEvent(StateEventType.pausing, {state: this});
			this.doPause();
			this.flags |= StateFlags.paused;
		}
	}

	unpause(): void {
		if (this.flags & StateFlags.paused) {
			State.onEvent(StateEventType.unpausing, {state: this});
			this.doUnpause();
			this.flags &= ~StateFlags.paused;
		}
	}

	/**
	 * Toggle the pause state.
	 *
	 * @returns true if paused after this call; otherwise false.
	 */
	togglePause(): boolean {
		if (this.flags & StateFlags.paused) {
			this.unpause();
			return false;
		}
		this.pause();
		return true;
	}

	attach(): void {
		if (!(this.flags & StateFlags.attached)) {
			State.onEvent(StateEventType.attaching, {state: this});
			this.doAttach();
			this.flags |= StateFlags.attached;
		}
	}

	detach(): void {
		if (this.flags & StateFlags.attached) {
			State.onEvent(StateEventType.detaching, {state: this});
			this.doDetach();
			this.flags &= ~StateFlags.attached;
		}
	}

	/**
	 * Preload any assets required.
	 *
	 * Override this method to define this state's preloading requirements.
	 */
	protected doPreload(): Promise<any> {
		return Promise.resolve();
	}

	/** Destroy any assets loaded by `doPreload`. */
	protected doUnload(): void {
	}

	/**
	 * Initialise this state.
	 *
	 * Override this method to provide application-specific initialisation. For
	 * example, scenery and actors might be created here.
	 *
	 * @param preloadData the data returned (wrapped in a promise) by
	 * {@link doPreload}.
	 */
	protected doInit(preloadData: any): any {
	}

	/** Un-initialise this state. */
	protected doDeinit(): void {
	}

	/**
	 * Start this state.
	 *
	 * Override this method to provide application-specific start logic. For
	 * example, physics/logic loops or timers might be started here.
	 */
	protected doStart(initData: any): void {
	}

	/** Stop this state. */
	protected doStop(): void {
	}

	/**
	 * Pause this state.
	 *
	 * Override to provide application-specific pause logic. For example,
	 * physics/logic loops or timers might be paused here.
	 */
	protected doPause(): void {
	}

	/** Un-pause this state. */
	protected doUnpause(): void {
	}

	/**
	 * Attach this state to the rest of the game.
	 *
	 * Override to provide appliciation-specific attachment logic. For example,
	 * event listeners might be added to an events manager here.
	 */
	protected doAttach(): void {
	}

	/** Detach this state from the rest of the game. */
	protected doDetach(): void {
	}

	/** Cause this state to initialise. */
	private _init(preloadData: any): Promise<any> {
		const data = this.doInit(preloadData);
		State.onEvent(StateEventType.initDone, {
			state: this,
			data: data,
		});
		this.flags |= StateFlags.initialised;
		return Promise.resolve(data);
	}

	/** Cause this state to start. */
	private _start(initData: any): void {
		State.onEvent(StateEventType.starting, {
			state: this,
			data: initData,
		});
		this.doStart(initData);
		this.flags |= StateFlags.running;
	}
}


export interface StateMethods {
	doPreload?: (this: State) => Promise<void>;
	onUnload?: (this: State) => void;

	doInit?: (this: State, preloadData: any) => any;
	doDeinit?: (this: State) => void;

	doStart?: (this: State, initData: any) => any;
	doStop?: (this: State) => void;

	doPause?: (this: State) => any;
	doUnpause?: (this: State) => any;

	doAttach?: (this: State) => any;
	doDetach?: (this: State) => any;
}


export function state<Context>(
	name: string,
	methods?: StateMethods,
	context?: Context
)
	: State
{
	const state = new State(name);
	if (methods) {
		for (let key in <any> methods) {
			(<any> state)[key] = (<any> methods)[key];
		}
	}
	return state;
}


export interface StateWrapper<Wrapped> extends State {
	readonly context: Wrapped;
}


const wrapProto: any = {};
export function wrap<Wrapped>(
	name: string,
	context: Wrapped,
	methods?: StateMethods
)
	:	StateWrapper<Wrapped>
{
	const state = new State(name);
	if (methods) {
		for (let key in <any> methods) {
			(<any> state)[key] = wrapProto[key] || (
				wrapProto[key] = function(this: any): any {
					return this.context[key].apply(this.context, arguments);
				}
			);
		}
	}
	return <StateWrapper<Wrapped>> state;
}
