import {State as StateBase} from './State';


export interface PreTriggerEvent<State, Trigger> {
	trigger: Trigger;
	current: State;
	next: State;
}


export interface PostTriggerEvent<State, Trigger> {
	trigger: Trigger;
	prev: State;
	current: State;
}


export interface PreTriggerHandler<State, Trigger> {
	(event: PreTriggerEvent<State, Trigger>): void | false;
}


export interface PostTriggerHandler<State, Trigger> {
	(event: PostTriggerEvent<State, Trigger>): void;
}


interface TriggerDict {
	[sourceName: string]: string;
}


export class Manager<State extends StateBase, Trigger> {
	preTrigger: PreTriggerHandler<State, Trigger>;
	postTrigger: PostTriggerHandler<State, Trigger>;

	private readonly triggers = new Map<Trigger, TriggerDict>();
	private readonly states = new Map<string, State>();

	constructor(private curr: State) {
	}

	get current(): State {
		return this.curr;
	}

	keys(): IterableIterator<string> {
		return this.states.keys();
	}

	values(): IterableIterator<State> {
		return this.states.values();
	}

	entries(): IterableIterator<[string, State]> {
		return this.states.entries();
	}

	add(state: State): void {
		if (this.states.has(state.name)) {
			throw new Error(`State '${state.name}' already exists`);
		}
		this.states.set(state.name, state);
	}

	has(name: string): boolean {
		return this.states.has(name);
	}

	jump(name: string): Promise<void> {
		const next = this.states.get(name);
		if (!next) {
			throw new Error(`No '${name}' state`);
		}
		return this.doJump(next);
	}

	on(name: string, trigger: Trigger, next: string): void {
		let dict = this.triggers.get(trigger);
		if (!dict) {
			this.triggers.set(trigger, dict = {});
		}
		dict[name] = next;
	}

	onTrigger(trigger: Trigger, successors: {[name: string]: string;}): void {
		const dict = this.triggers.get(trigger);
		if (dict) {
			Object.assign(dict, successors);
		}
		else {
			this.triggers.set(trigger, Object.assign({}, successors));
		}
	}

	fire(trigger: Trigger): Promise<boolean> {
		const dict = this.triggers.get(trigger);
		if (!dict) {
			throw new Error(`Unknown trigger: '${trigger}'`);
		}

		const nextName = dict[this.current.name];
		if (!nextName) {
			throw new Error(
				`State ${this.current.name} has no ${trigger} event`);
		}

		const nextState = this.states.get(nextName);
		if (!nextState) {
			throw new Error(`No '${nextName}' state`);
		}

		if (this.preTrigger && (false === this.preTrigger({
			trigger: trigger,
			current: this.curr,
			next: nextState,
		}))) {
			return Promise.resolve(false);
		}

		const oldState = this.curr;
		return this.doJump(nextState).then((): boolean => {
			if (this.postTrigger) {
				this.postTrigger({
					trigger: trigger,
					prev: oldState,
					current: nextState,
				});
			}
			return true;
		});
	}

	private doJump(state: State): Promise<void> {
		this.curr.end();
		this.curr = state;
		return state.start();
	}
}
