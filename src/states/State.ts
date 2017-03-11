import {noop} from '../util/misc';


export interface StateOptions {
	/** The State's name. */
	name: string;
	/** Whether this state should begin in paused mode. */
	paused?: boolean;
}


/**
 * Basic state class.
 *
 * States can be executed linearly or as tree nodes (or both). Basic behaviour
 * is injected by subclassing and overriding certain methods.
 */
export class State {
	static onAnyPreloadBegin: (state: State) => void = noop;
	static onAnyPreloadEnd: (state: State, data: any) => void = noop;
	static onAnyStart: (state: State, data: any) => void = noop;
	static onAnyPause: (state: State) => void = noop;
	static onAnyUnpause: (state: State) => void = noop;
	static onAnyEnd: (state: State) => void = noop;

	readonly name: string;

	private preloaded: Promise<any> | null;
	private running: boolean;
	private paused: boolean;

	constructor(options: StateOptions) {
		this.name = options.name;
		this.preloaded = null;
		this.running = false;
		this.paused = !!options.paused;
	}

	get isPaused(): boolean {
		return this.paused;
	}

	get isRunning(): boolean {
		return this.running;
	}

	preload(): Promise<any> {
		State.onAnyPreloadBegin(this);
		return this.preloaded || (
			this.preloaded = Promise.resolve(this.doPreload()).then(
				<Data>(data: Data): Data => {
					State.onAnyPreloadEnd(this, data);
					return data;
				}
			)
		);
	}

	start(): Promise<void> {
		return this.preload().then(this.doStart.bind(this));
	}

	pause(): void {
		if (!this.paused) {
			State.onAnyPause(this);
			this.onPause();
			this.paused = true;
		}
	}

	unpause(): void {
		if (this.paused) {
			State.onAnyUnpause(this);
			this.onUnpause();
			this.paused = false;
		}
	}

	/**
	 * Toggle the pause state.
	 *
	 * @returns true if paused after this call; otherwise false.
	 */
	togglePause(): boolean {
		if (this.paused) {
			this.unpause();
			return false;
		}
		this.pause();
		return true;
	}

	end(): void {
		if (this.running) {
			this.running = false;
			State.onAnyEnd(this);
			this.onEnd();
		}
	}

	/** Pre-load any assets required; can be overridden. */
	protected doPreload(): any {
	}

	/** Do the actual work of starting this state; can be overridden. */
	protected onStart(preloadData: any): void {
	}

	/** Do the actual work of pausing this state; can be overridden. */
	protected onPause(): void {
	}

	/** Do the actual work of un-pausing this state; can be overridden. */
	protected onUnpause(): void {
	}

	/** Do the actual work of ending this state; can be overridden. */
	protected onEnd(): void {
	}

	/** Cause this state to start. */
	private doStart(preloadData: any): void {
		State.onAnyStart(this, preloadData);
		this.onStart(preloadData);
		this.running = true;
	}
}
