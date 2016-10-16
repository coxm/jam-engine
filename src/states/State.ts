import {noop} from '../util/misc';


export interface StateOptions {
	name: string;
	parent?: State;
	startChildrenImmediately?: boolean;
	endWhenChildrenDone?: boolean;
	paused?: boolean;
}


/**
 * Basic state class.
 *
 * States can be executed linearly or as tree nodes (or both). Basic behaviour
 * is injected by subclassing and overriding certain methods.
 */
export class State {
	static current(): State {
		return State.currentState;
	}

	static onAnyPreloadBegin: (state: State) => void = noop;
	static onAnyPreloadEnd: (state: State, data: any) => void = noop;
	static onAnyStart: (state: State, data: any) => void = noop;
	static onAnyPause: (state: State) => void = noop;
	static onAnyUnpause: (state: State) => void = noop;
	static onAnyEnd: (state: State) => void = noop;

	readonly name: string;

	private parentState: State | null;

	private childStates: State[];

	private static currentState: State;

	private currentChild: number;
	private startChildrenImmediately: boolean;
	private endWhenChildrenDone: boolean;
	private preloaded: Promise<any> | null;
	private running: boolean;
	private paused: boolean;

	constructor(options: StateOptions) {
		this.name = options.name;
		this.childStates = [];
		this.currentChild = -1;
		this.parentState = options.parent || null;
		this.startChildrenImmediately = !!options.startChildrenImmediately;
		this.endWhenChildrenDone = !!options.endWhenChildrenDone;
		this.preloaded = null;
		this.running = false;
		this.paused = !!options.paused;
	}

	get parent(): State|null {
		return this.parentState;
	}

	isPaused(): boolean {
		return this.paused;
	}

	isRunning(): boolean {
		return this.running;
	}

	preload(): Promise<any> {
		State.onAnyPreloadBegin(this);
		return this.preloaded || (
			this.preloaded = this.doPreload().then(
				<Data>(data: Data): Data => {
					State.onAnyPreloadEnd(this, data);
					return data;
				}
			)
		);
	}

	start(): void {
		if (State.currentState && !State.currentState.isAncestorOf(this)) {
			State.currentState.end();
		}
		State.currentState = this;
		this.preload().then((preloadData: any): void => {
			State.onAnyStart(this, preloadData);
			this.onStart(preloadData);
			this.running = true;
			if (this.startChildrenImmediately) {
				this.nextChild();
			}
		});
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
		if (this.parentState === null) {
			throw new Error("Ending state with no parent");
		}
		this.running = false;
		State.onAnyEnd(this);
		this.onEnd();
		this.parentState.onChildEnd(this);
	}

	isAncestorOf(state: State): boolean {
		let parent: State|null = state.parent;
		while (parent) {
			if (this === parent) {
				return true;
			}
			parent = parent.parentState;
		}
		return false;
	}

	startChild(child: string|State): void {
		(typeof child === 'string' ? this.child(child) : child).start();
	}

	child(name: string): State {
		const state: State|undefined = this.childStates.find(
			(c: State): boolean => c.name === name
		);

		if (!state) {
			throw new Error("No such child state: " + name);
		}

		return state;
	}

	addChild(child: State): void {
		this.childStates.push(child);
		child.parentState = this;
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

	jumpToChild(child: string|State): void {
		(typeof child === 'string' ? this.child(child) : child).start();
	}

	protected doPreload(): Promise<any> {
		return Promise.resolve(null);
	}

	protected onStart(preloadData: any): void {
	}

	protected onPause(): void {
	}

	protected onUnpause(): void {
	}

	protected onEnd(): void {
	}

	protected onChildEnd(child: State): void {
		if (this.startChildrenImmediately) {
			this.nextChild();
		}
	}

	private nextChild(): void {
		if (
			++this.currentChild === this.children.length &&
			this.endWhenChildrenDone
		) {
			this.end();
		}
		const next: State = this.childStates[this.currentChild];
		if (!next) {
			throw new Error("No child states remaining");
		}
		next.start();
	}
}
