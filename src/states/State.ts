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

	readonly children: State[];

	private static currentState: State;

	readonly name: string;
	readonly parent: State | null;

	private currentChild: number;
	private startChildrenImmediately: boolean;
	private endWhenChildrenDone: boolean;
	private preloaded: Promise<any> | null;
	private running: boolean;
	private paused: boolean;

	constructor(options: StateOptions) {
		this.name = options.name;
		this.children = [];
		this.currentChild = -1;
		this.parent = options.parent || null;
		this.startChildrenImmediately = !!options.startChildrenImmediately;
		this.endWhenChildrenDone = !!options.endWhenChildrenDone;
		this.preloaded = null;
		this.running = false;
		this.paused = !!options.paused;
	}

	isPaused(): boolean {
		return this.paused;
	}

	isRunning(): boolean {
		return this.running;
	}

	preload(): Promise<any> {
		return this.preloaded || (this.preloaded = this.doPreload());
	}

	start(): void {
		if (State.currentState && !State.currentState.isAncestorOf(this)) {
			State.currentState.end();
		}
		State.currentState = this;
		this.preload().then((preloadData: any): void => {
			this.onStart(preloadData);
			this.running = true;
			if (this.startChildrenImmediately) {
				this.nextChild();
			}
		});
	}

	pause(): void {
		if (!this.paused) {
			this.onPause();
			this.paused = true;
		}
	}

	unpause(): void {
		if (this.paused) {
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
		if (this.parent === null) {
			throw new Error("Ending state with no parent");
		}
		this.running = false;
		this.onEnd();
		this.parent.nextChild();
	}

	isAncestorOf(state: State): boolean {
		let parent: State|null = state.parent;
		while (parent) {
			if (this === parent) {
				return true;
			}
			parent = parent.parent;
		}
		return false;
	}

	startChild(child: string|State): void {
		(typeof child === 'string' ? this.getChild(child) : child).start();
	}

	getChild(name: string): State {
		const state: State|undefined = this.children.find(
			(c: State): boolean => c.name === name
		);

		if (!state) {
			throw new Error("No such child state: " + name);
		}

		return state;
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

	private nextChild(): void {
		if (
			++this.currentChild === this.children.length &&
			this.endWhenChildrenDone
		) {
			this.end();
		}
		this.children[this.currentChild].start();
	}
}
