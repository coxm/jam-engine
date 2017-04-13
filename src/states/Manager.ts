import {noop} from 'jam/util/misc';

import {Relation} from './Relation';


export type Alias = number | string | symbol;


export interface TransitionBase<State, Trigger> {
	/** The trigger for this transition or `null` if caused by a jump. */
	readonly trigger: Trigger | null;
	/** How to deal with the outgoing state. */
	readonly exit: (state: State, trigger: Trigger | null) => void;
}


export interface RelationTransition<State, Trigger>
	extends TransitionBase<State, Trigger>
{
	/** The status of the new state in relation to the old. */
	readonly rel: Relation;
}


export interface IDTransition<State, Trigger>
	extends TransitionBase<State, Trigger>
{
	/** The ID of the new state. */
	readonly id: Alias;
}


export type Transition<S, T> = (
	RelationTransition<S, T> |
	IDTransition<S, T>
);


export interface AddOptions<State, Trigger> {
	readonly alias?: string | symbol;
	readonly children?: (Alias | State)[];
	readonly transitions?: Transition<State, Trigger>[];
}


export interface TriggerEvent<State, Trigger> {
	readonly trigger: Trigger | null;
	readonly old: State;
	readonly new: State;
}


interface Node<State, Trigger> {
	readonly id: number;
	readonly state: State;
	children: Alias[];
	transitions: Transition<State, Trigger>[];
	parent?: Alias;
}


let idCounter: number = -1;


export class Manager<State, Trigger> {
	preTrigger: (ev: TriggerEvent<State, Trigger>) => void = noop;
	postTrigger: (ev: TriggerEvent<State, Trigger>) => void = noop;

	private nodes = new Map<Alias, Node<State, Trigger>>();
	private list: Node<State, Trigger>[] = [];
	private curr: Node<State, Trigger>;

	constructor(options?: {
		preTrigger: (ev: TriggerEvent<State, Trigger>) => void;
		postTrigger: (ev: TriggerEvent<State, Trigger>) => void;
	}) {
		this.preTrigger = (options && options.preTrigger) || noop;
		this.postTrigger = (options && options.postTrigger) || noop;
	}

	set(key: Alias): void {
		if (this.curr) {
			throw new Error("Already initialised");
		}
		this.curr = this.getNode(key);
	}

	get current(): State {
		return this.curr.state;
	}

	id(key: Alias): number {
		return this.getNode(key).id;
	}

	at(key: Alias): State {
		return this.getNode(key).state;
	}

	has(key: Alias): boolean {
		return this.nodes.has(key);
	}

	hasChildren(key: Alias): boolean {
		return this.getNode(key).children.length !== 0;
	}

	isUnique(state: State): boolean {
		let found = false;
		for (let i = 0, len = this.list.length; i < len; ++i) {
			if (this.list[i].state === state) {
				if (found) {
					return false;
				}
				found = true;
			}
		}
		return found;
	}

	count(state: State): number {
		let num = 0;
		for (let i = 0, len = this.list.length; i < len; ++i) {
			if (this.list[i].state === state) {
				++num;
			}
		}
		return num;
	}

	*keys(): IterableIterator<number> {
		for (let node of this.list) {
			yield node.id;
		}
	}

	*values(): IterableIterator<State> {
		for (let node of this.list) {
			yield node.state;
		}
	}

	*entries(): IterableIterator<[number, State]> {
		for (let node of this.list) {
			yield [node.id, node.state];
		}
	}

	*children(key: Alias): IterableIterator<[Alias, State]> {
		const parent = this.getNode(key);
		for (let id of parent.children) {
			yield [id, this.getNode(id).state];
		}
	}

	*siblings(key: Alias): IterableIterator<[Alias, State]> {
		const parent = this.getParent(key);
		for (let id of parent.children) {
			yield [id, this.getNode(id).state];
		}
	}

	*ancestors(key: Alias, strict: boolean = false)
		: IterableIterator<[Alias, State]>
	{
		let node: Node<State, Trigger> = this.getNode(key);
		if (!strict) {
			yield [node.id, node.state];
		}
		while (node.parent !== undefined) {
			node = this.nodes.get(node.parent)!;
			yield [node.id, node.state];
		}
	}

	tryParent(key: Alias): [number, State] | null {
		const node = this.getNode(key);
		const parent = this.getNode(node.parent!)!;
		return node ? [parent.id, parent.state] : null;
	}

	add(state: State, options?: AddOptions<State, Trigger>): number {
		const node = this.createNode(state);
		if (options && options.hasOwnProperty('alias')) {
			this.nodes.set(options.alias!, node);
		}
		if (options) {
			if (options.children) {
				this.appendChildren(node.id, options.children);
			}
			if (options.transitions) {
				this.onMany(node.id, options.transitions);
			}
		}
		return node.id;
	}

	addTransitions(key: Alias, list: Transition<State, Trigger>[]): void {
		const node = this.getNode(key);
		node.transitions = node.transitions.concat(list);
	}

	appendChild(parentKey: Alias, child: Alias | State): number {
		const parent = this.getNode(parentKey);
		const childNode = this.getOrCreateNode(child);
		parent.children.push(childNode.id);
		childNode.parent = parentKey;
		return childNode.id;
	}

	appendChildren(parentKey: Alias, children: (Alias | State)[]): number[] {
		const parent = this.getNode(parentKey);
		return children.map(child => {
			const childNode = this.getOrCreateNode(child);
			childNode.parent = parent.id;
			parent.children.push(childNode.id);
			return childNode.id;
		});
	}

	on(key: Alias, transition: Transition<State, Trigger>): void {
		this.getNode(key).transitions.push(transition);
	}

	onMany(key: Alias, transitions: Transition<State, Trigger>[]): void {
		const node = this.getNode(key);
		node.transitions = node.transitions.concat(transitions);
	}

	/**
	 * Jump to another state.
	 *
	 * @param key an alias or ID for the new state.
	 * @param exit an exit strategy for leaving the current state.
	 */
	jump(key: Alias, exit: (state: State, trigger: null) => void): void {
		this._jump(key, null, exit);
	}

	trigger(trigger: Trigger): void {
		const transition = this.curr.transitions.find(
			tr => tr.trigger === trigger
		);
		if (!transition) {
			return this.onEmptyTransition(trigger);
		}
		let nextID = (<IDTransition<State, Trigger>> transition).id;
		if (typeof nextID !== 'number') {
			switch (
				(<RelationTransition<State, Trigger>> transition).rel
			) {
				case Relation.sibling: {
					const sibs = this.getNode(this.curr.parent!).children;
					nextID = sibs[sibs.length - 1];
					break;
				}
				case Relation.parent:
					nextID = this.curr.parent!;
					break;
				case Relation.child:
					nextID = this.curr.children[0];
					break;
			}
		}
		this._jump(nextID, trigger, transition.exit);
	}

	protected onEmptyTransition(trigger: Trigger): void {
		throw new Error("No transition for trigger: " + trigger);
	}

	private _jump(
		nextID: Alias,
		trigger: Trigger | null,
		exit: (state: State, trigger: Trigger | null) => void
	)
		: void
	{
		const next = this.getNode(nextID);
		const ev = {
			new: next.state,
			old: this.curr.state,
			trigger: trigger,
		};
		this.preTrigger(ev);
		exit(ev.old, trigger);
		this.curr = next;
		this.postTrigger(ev);
	}

	private getOrCreateNode(arg: Alias | State): Node<State, Trigger> {
		return (typeof arg === 'object'
			?	this.createNode(arg)
			:	this.getNode(arg)
		);
	}

	private createNode(state: State): Node<State, Trigger> {
		const id = ++idCounter;
		const node = {
			id,
			state,
			children: [],
			transitions: [],
		};
		this.nodes.set(id, node);
		this.list.push(node);
		return node;
	}

	private getNode(key: Alias): Node<State, Trigger> {
		const node = this.nodes.get(key);
		if (node) {
			return node;
		}
		throw new Error(`No such state: ${key}`);
	}

	private getParent(key: Alias): Node<State, Trigger> {
		const node = this.getNode(key);
		if (node.parent === undefined) {
			throw new Error(`State ${key} has no parent`);
		}
		return this.getNode(node.parent);
	}
}
