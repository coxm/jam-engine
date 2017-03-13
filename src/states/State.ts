import {noop} from '../util/misc';


export interface StateOptions {
	/** The State's name. */
	name: string;
	/** Whether this state should begin in paused mode. */
	paused?: boolean;
}


export const enum StateFlags {
	preloaded = 1,
	running = 2,
	paused = 4,
	attached = 8,
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

	protected flags: number = 0;

	constructor(options: StateOptions) {
		this.name = options.name;
		this.preloaded = null;
		this.running = false;
		this.paused = !!options.paused;
	}

	get isPreloaded(): boolean {
		return 0 !== (this.flags & StateFlags.preloaded);
	}

	get isPaused(): boolean {
		return 0 !== (this.flags & StateFlags.paused);
	}

	get isRunning(): boolean {
		return 0 !== (this.flags & StateFlags.running);
	}

	get isAttached(): boolean {
		return 0 !== (this.flags & StateFlags.attached);
	}

	preload(): Promise<any> {
		State.onAnyPreloadBegin(this);
		return this.preloaded || (
			this.preloaded = Promise.resolve(this.doPreload()).then(
				<Data>(data: Data): Data => {
					State.onAnyPreloadEnd(this, data);
					this.flags |= StateFlags.preloaded;
					return data;
				}
			)
		);
	}

	start(): Promise<void> {
		return this.preload().then(this.doStart.bind(this));
	}

	pause(): void {
		if (!(this.flags & StateFlags.paused)) {
			State.onAnyPause(this);
			this.onPause();
			this.flags |= StateFlags.paused;
		}
	}

	unpause(): void {
		if (this.flags & StateFlags.paused) {
			State.onAnyUnpause(this);
			this.onUnpause();
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

	end(): void {
		this.detach();
		if (this.flags & StateFlags.running) {
			State.onAnyEnd(this);
			this.flags &= ~StateFlags.running
			this.onEnd();
		}
	}

	attach(): void {
		if (!(this.flags & StateFlags.attached)) {
			this.onAttach();
			this.flags |= StateFlags.attached;
		}
	}

	detach(): void {
		if (this.flags & StateFlags.attached) {
			this.onDetach();
			this.flags &= ~StateFlags.attached;
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

	/** Do the actual work of attaching this state; can be overridden. */
	protected onAttach(): void {
	}

	/** Do the actual work of detaching this state; can be overridden. */
	protected onDetach(): void {
	}

	/** Cause this state to start. */
	private doStart(preloadData: any): void {
		State.onAnyStart(this, preloadData);
		this.onStart(preloadData);
		this.flags |= StateFlags.running;
	}
}
