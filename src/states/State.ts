import {noop} from '../util/misc';


export interface StateOptions {
	/** The State's name. */
	name: string;
	/** Optionally specify a parent of the state. */
	parent?: State;
	/** Whether to automatically start children (defaults to `false`). */
	autoStartChildren?: boolean;
	/** Whether to end when children are finished (default `false`). */
	endWhenChildrenDone?: boolean;
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
	/** Get the current state. */
	static current: (this: typeof State) => State;

	/** Pause the current state, if any. */
	static pauseCurrent: (this: typeof State) => void;

	/** Unpause the current state, if any. */
	static unpauseCurrent: (this: typeof State) => void;

	/** End the current state, if any. */
	static endCurrent: (this: typeof State) => void;

	private static readonly parents = new WeakMap<State, State>();

	static onAnyPreloadBegin: (state: State) => void = noop;
	static onAnyPreloadEnd: (state: State, data: any) => void = noop;
	static onAnyStart: (state: State, data: any) => void = noop;
	static onAnyPause: (state: State) => void = noop;
	static onAnyUnpause: (state: State) => void = noop;
	static onAnyEnd: (state: State) => void = noop;

	readonly name: string;

	private parentName: string;

	private childStates: State[];

	private static currentState: State;

	private currentChild: number;
	private autoStartChildren: boolean;
	private endWhenChildrenDone: boolean;
	private preloaded: Promise<any> | null;
	private running: boolean;
	private paused: boolean;

	constructor(options: StateOptions) {
		this.name = options.name;
		this.childStates = [];
		this.currentChild = -1;
		this.autoStartChildren = !!options.autoStartChildren;
		this.endWhenChildrenDone = !!options.endWhenChildrenDone;
		this.preloaded = null;
		this.running = false;
		this.paused = !!options.paused;
		State.parents.set(this, options.parent);
	}

	get parent(): State|undefined {
		return State.parents.get(this);
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
			const parent = this.parent;
			if (parent) {
				parent.onChildEnd(this);
			}
		}
	}

	isAncestorOf(state: State): boolean {
		let next: State|undefined = state.parent;
		while (next) {
			if (this === next) {
				return true;
			}
			next = next.parent;
		}
		return false;
	}

	/**
	 * Descend into a child state.
	 *
	 * This state keeps running, but the child becomes the active state.
	 */
	startChild(child: string|State): void {
		(typeof child === 'string' ? this.child(child) : child).start();
	}

	/** Get a child state, looking it up by name. */
	child(name: string): State {
		const state: State|undefined = this.childIfExists(name);
		if (!state) {
			throw new Error("No such child state: " + name);
		}
		return state;
	}

	/** Get a child state, looking it up by name. */
	childIfExists(name: string): State|undefined {
		return this.childStates.find((c: State): boolean => c.name === name);
	}

	addChild(child: State): void {
		this.childStates.push(child);
		child.parentName = this.name;
	}

	removeChild(child: string|State): void {
		const index: number = (typeof child === 'string'
			?	this.childStates.findIndex(
					(c: State): boolean => c.name === child
				)
			:	this.childStates.findIndex((c: State): boolean => c === child)
		);
		if (index < 0) {
			throw new Error("No such child state: " + (
				typeof child === 'string' ? child : child.name
			));
		}
		this.childStates.splice(index, 1);
		if (this.currentChild >= index) {
			--this.currentChild;
		}
	}

	children(): IterableIterator<[number, State]> {
		return this.childStates.entries();
	}

	mapChildren<T>(fn: (child: State, i: number) => T): T[] {
		return this.childStates.map(fn);
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

	/** React to a child ending; can be overridden. */
	protected onChildEnd(child: State): void {
		++this.currentChild;
		this.atCurrentChild();
	}

	/** Cause this state to start. */
	private doStart(preloadData: any): void {
		if (State.currentState && !State.currentState.isAncestorOf(this)) {
			State.currentState.end();
		}
		State.currentState = this;
		State.onAnyStart(this, preloadData);
		this.onStart(preloadData);
		this.running = true;
		this.atCurrentChild();
	}

	/** Take action when at the next child. */
	private atCurrentChild(): void {
		if (!this.childStates[this.currentChild]) {
			if (this.endWhenChildrenDone) {
				this.end();
			}
		}
		else if (this.autoStartChildren) {
			this.childStates[this.currentChild].start();
		}
	}
}


State.current = function(this: any): State {
	return this.currentState;
};


State.pauseCurrent = function(this: any): void {
	this.currentState && this.currentState.pause();
};


State.unpauseCurrent = function(this: any): void {
	this.currentState && this.currentState.unpause();
};


State.endCurrent = function(this: any): void {
	this.currentState && this.currentState.end();
};
