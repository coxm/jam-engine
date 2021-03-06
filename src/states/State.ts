import {noop} from '../util/misc';


export const enum StateFlags {
	none = 0,
	preloaded = 1,
	initialised = 2,
	running = 4,
	attached = 8,
	paused = 16,
	started = 32,
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


export interface StateEvent<T, StateT = State> {
	readonly state: StateT;
	readonly data?: T;
}


export interface StateMethods<PreloadData, InitData, System> {
	readonly doPreload?: (this: State) => Promise<PreloadData>;
	readonly onUnload?: (this: State) => void;

	readonly doInit?: (this: State, preloadData: PreloadData) => InitData;
	readonly doDeinit?: (this: State) => void;

	readonly doStart?: (this: State, initData: InitData) => void;
	readonly doStop?: (this: State) => void | Promise<void>;

	readonly doPause?: (this: State) => void;
	readonly doUnpause?: (this: State) => void;

	readonly doAttach?: (this: State, to: System) => void;
	readonly doDetach?: (this: State, from: System) => void;
}


/**
 * Basic state class.
 *
 * States can be executed linearly or as tree nodes (or both). Basic behaviour
 * is injected by subclassing and overriding certain methods.
 *
 * Each State has a number of flags representing its condition:
 * - isPreloaded - whether the state has preloaded its data;
 * - isInitialised - whether the state has initialised;
 * - willRun - whether the state's `start()` method has been called and not
 *   subsequently stopped.
 * - isRunning - whether the state has started;
 * - isPaused - whether the state is paused;
 * - isAttached - whether the state is 'attached', e.g. is hooked up to event
 *   systems, rendering pipelines or other game systems.
 *
 * Each of these flags corresponds to a property of the same name.
 *
 * A state will preload before initialising, and initialise before starting.
 * Other flags are independent of one another. For example a state can start
 * while paused (perhaps useful if action will begin immediately), and can be
 * detached while running (e.g. to run in the background).
 */
export class State<
	PreloadData = any,
	InitData = PreloadData,
	System = any
> {
	static onEvent: (type: StateEventType, ev: StateEvent<any>) => void = noop;

	static fromHooks:
		<Methods extends StateMethods<any, any, any>, OutT = State>
		(methods: Methods, ...initData: any[]) => OutT & Methods;

	private preloaded: Promise<PreloadData> | null = null;
	private initialised: Promise<InitData> | null = null;
	private started: Promise<void> | null = null;

	protected flags: number = StateFlags.none;

	constructor(readonly name?: string) {
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

	get willRun(): boolean {
		return 0 !== (this.flags & StateFlags.started);
	}

	get isRunning(): boolean {
		return 0 !== (this.flags & StateFlags.running);
	}

	get isPaused(): boolean {
		return 0 !== (this.flags & StateFlags.paused);
	}

	/** Fetch any data required to initialise. */
	preload(): Promise<PreloadData> {
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
		if (this.flags & StateFlags.preloaded) {
			this.preloaded = null;
			this.flags &= ~StateFlags.preloaded;
			this.doUnload();
		}
	}

	/**
	 * Initialise this state.
	 *
	 * Preloads state data if not already loaded.
	 *
	 * @returns a promise which resolves when the state has preloaded and
	 * initialised.
	 */
	init(): Promise<InitData> {
		return this.initialised || (this.initialised = this.preload().then(
			(prData: PreloadData): Promise<InitData> => this._init(prData)
		));
	}

	/**
	 * Re-initialise this state.
	 *
	 * Equivalent to de-initialising then initialising again.
	 */
	reinit(): Promise<InitData> {
		this.deinit();
		return this.init();
	}

	/** Undo initialisation. */
	async deinit(): Promise<void> {
		if (!this.isInitialised) {
			return;
		}
		await this.stop();
		State.onEvent(StateEventType.deiniting, {state: this});
		this.doDeinit();
		this.flags &= ~StateFlags.initialised;
		this.initialised = null;
	}

	/** Unload and de-initialise this state. */
	async destroy(): Promise<void> {
		await this.stop();
		this.unload();
		await this.deinit();
	}

	/**
	 * Start this state.
	 *
	 * Does not restart the state if already running, or a previous `start()`
	 * call is pending. Does not un-pause the state.
	 */
	start(): Promise<void> {
		if (this.started) {
			return this.started;
		}
		this.flags |= StateFlags.started;
		return this.restart();
	}

	/**
	 * Start this state.
	 *
	 * Starts the state, even if it is already running or a previous `start()`
	 * call is pending. Does not un-pause the state.
	 *
	 * Initialises via {@link init} before starting.
	 */
	restart(): Promise<void> {
		return this.started = this.init().then(
			(data: InitData) => this._start(data)
		);
	}

	/** Stop this state. */
	async stop(): Promise<void> {
		if (this.flags & StateFlags.running) {
			State.onEvent(StateEventType.stopping, {state: this});
			await this.doStop();
			this.flags &= ~StateFlags.running;
			this.started = null;
		}
	}

	/**
	 * Ensure this state is started and unpaused.
	 *
	 * Does not restart or pause the state if already running and/or unpaused.
	 *
	 * @returns a promise which resolves when the state has started and been
	 * un-paused.
	 */
	async resume(): Promise<void> {
		await this.start();
		this.unpause();
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

	attach(system: System): void {
		if (!(this.flags & StateFlags.initialised)) {
			throw new Error("State uninitialised");
		}
		if (!(this.flags & StateFlags.attached)) {
			State.onEvent(StateEventType.attaching, {state: this});
			this.doAttach(system);
			this.flags |= StateFlags.attached;
		}
	}

	detach(system: System): void {
		if (this.flags & StateFlags.attached) {
			State.onEvent(StateEventType.detaching, {state: this});
			this.doDetach(system);
			this.flags &= ~StateFlags.attached;
		}
	}

	/**
	 * Preload any assets required.
	 *
	 * Override this method to define this state's preloading requirements.
	 *
	 * @returns {PreloadData} the preload data.
	 */
	protected doPreload(): any {
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
	 * @param preloadData the data obtained from {@link doPreload}.
	 */
	protected doInit(preloadData: PreloadData): InitData {
		return preloadData as any as InitData;
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
	protected doStart(initData: InitData): void {
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
	protected doAttach(system: System): void {
	}

	/** Detach this state from the rest of the game. */
	protected doDetach(system: System): void {
	}

	/** Cause this state to initialise. */
	private _init(preloadData: PreloadData): Promise<InitData> {
		const data = this.doInit(preloadData);
		State.onEvent(StateEventType.initDone, {
			state: this,
			data: data,
		});
		this.flags |= StateFlags.initialised;
		return Promise.resolve(data);
	}

	/** Cause this state to start. */
	private _start(initData: InitData): void {
		if (this.isRunning) {
			return;
		}
		State.onEvent(StateEventType.starting, {
			state: this,
			data: initData,
		});
		this.doStart(initData);
		this.flags |= StateFlags.running;
	}
}


State.fromHooks = (
	function State_fromHooks(this: any, hooks: any, ...initArgs: any[]) {
		return Object.assign(
			new (this.prototype instanceof State ? this : State)(...initArgs),
			hooks);
	}
) as typeof State.fromHooks;
