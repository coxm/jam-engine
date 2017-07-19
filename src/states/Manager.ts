import {noop} from 'jam/util/misc';

import {Relation} from './Relation';


export type Alias = number | string | symbol;


export type TriggerCallback<State, Trigger> = (
	state: State,
	trigger: Trigger | null,
	manager: Manager<State, Trigger>
) => void;


export interface TransitionBase<State, Trigger> {
	/** The trigger for this transition or `null` if caused by a jump. */
	readonly trigger: Trigger | null;
	/** A callback for shutting down the outgoing state. */
	readonly exit?: TriggerCallback<State, Trigger>;
	/** A callback for initialising the incoming state. */
	readonly enter?: TriggerCallback<State, Trigger>;
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


/**
 * Options to use when adding a state to a {@link Manager}.
 *
 * @see {@link Manager#add}.
 */
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
	readonly alias: PropertyKey | undefined;
	readonly state: State;
	children: Alias[];
	transitions: Transition<State, Trigger>[];
	parent?: Alias;
}


let idCounter: number = -1;


export interface ManagerOptions<State, Trigger> {
	readonly initial?: string | symbol;
	readonly states?: [string | symbol, State][];
	readonly preTrigger?: (ev: TriggerEvent<State, Trigger>) => void;
	readonly postTrigger?: (ev: TriggerEvent<State, Trigger>) => void;
}


/**
 * State managing class.
 *
 * @see {@tutorial docs/examples/states.ts} for a full example.
 */
export class Manager<State, Trigger> {
	/** A callback called before each state transition. */
	preTrigger: (ev: TriggerEvent<State, Trigger>) => void = noop;
	/** A callback called after each state transition. */
	postTrigger: (ev: TriggerEvent<State, Trigger>) => void = noop;

	private nodes = new Map<Alias, Node<State, Trigger>>();
	private list: Node<State, Trigger>[] = [];
	private curr: Node<State, Trigger>;

	constructor(options: ManagerOptions<State, Trigger> = {}) {
		if (options.states) {
			for (const [alias, state] of options.states) {
				this.add(state, {alias: alias});
			}
		}
		if (options.initial) {
			this.setInitial(options.initial);
		}
		this.preTrigger = options.preTrigger || noop;
		this.postTrigger = options.postTrigger || noop;
	}

	/**
	 * Set the initial state.
	 *
	 * Can only be called once.
	 *
	 * @throws {Error} on subsequent calls.
	 */
	setInitial(key: Alias): void {
		if (this.curr) {
			throw new Error("Already initialised");
		}
		this.curr = this.getNode(key);
	}

	/** Get the current state. */
	get current(): State {
		return this.curr.state;
	}

	/** Get the ID of the current state. */
	get currentID(): number {
		return this.curr.id;
	}

	/**
	 * Get the ID of a state, given its alias or ID.
	 *
	 * @returns the state's ID.
	 * @throws {Error} if the requested state doesn't exist.
	 */
	id(key: Alias): number {
		return this.getNode(key).id;
	}

	/**
	 * Get a state, given its alias or ID.
	 *
	 * @returns the state object.
	 * @throws {Error} if the requested state doesn't exist.
	 */
	at(key: Alias): State {
		return this.getNode(key).state;
	}

	/** Check if an alias points to a state. */
	has(key: Alias): boolean {
		return this.nodes.has(key);
	}

	/**
	 * Check if a state has any children.
	 *
	 * @throws {Error} if the referred-to state doesn't exist.
	 */
	hasChildren(key: Alias): boolean {
		return this.getNode(key).children.length !== 0;
	}

	/**
	 * Check if a state object is unique.
	 *
	 * State IDs and aliases will always be unique, but the actual state object
	 * can appear multiple times, to prevent unnecessary duplication. This
	 * method checks whether a state has been added multiple times.
	 */
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

	/**
	 * Count the number of times a state appears in the tree.
	 *
	 * State IDs and aliases will always be unique, but the actual state object
	 * can appear multiple times, to prevent unnecessary duplication.
	 */
	count(state: State): number {
		let num = 0;
		for (let i = 0, len = this.list.length; i < len; ++i) {
			if (this.list[i].state === state) {
				++num;
			}
		}
		return num;
	}

	/**
	 * Get an iterable of state IDs.
	 *
	 * States which have been included multiple times will appear as many times
	 * in the iterable.
	 */
	*keys(): IterableIterator<number> {
		for (const node of this.list) {
			yield node.id;
		}
	}

	/**
	 * Get an iterable of states in the tree.
	 *
	 * States which have been included multiple times will appear as many times
	 * in the iterable.
	 */
	*values(): IterableIterator<State> {
		for (const node of this.list) {
			yield node.state;
		}
	}

	/**
	 * Get an `[ID, state]` pair iterator.
	 *
	 * States which have been included multiple times will appear as many times
	 * in the iterable.
	 */
	*entries(): IterableIterator<[number, State]> {
		for (const node of this.list) {
			yield [node.id, node.state];
		}
	}

	/**
	 * Get an iterable of children for a state.
	 *
	 * @param key the ID or alias of a state in the tree.
	 * @returns an iterable of the referred-to state's children, or if no key
	 * is provided, the children of the current state.
	 */
	*children(key?: Alias): IterableIterator<[Alias, State]> {
		const parent = key === undefined ? this.curr : this.getNode(key);
		for (const id of parent.children) {
			yield [id, this.getNode(id).state];
		}
	}

	/**
	 * Get an iterable of siblings for a state.
	 *
	 * @param key the ID or alias of a state in the tree.
	 * @returns an iterable of the referred-to state's siblings, or if no key
	 * is provided, the siblings of the current state.
	 */
	*siblings(key?: Alias): IterableIterator<[Alias, State]> {
		const parent = key === undefined ? this.curr : this.getParent(key);
		for (const id of parent.children) {
			yield [id, this.getNode(id).state];
		}
	}

	/**
	 * Get an iterable of ancestors for a state.
	 *
	 * @param key the ID or alias of a state in the tree.
	 * @param strict whether to exclude the state as an ancestor of itself.
	 * @returns an iterable of the referred-to state's ancestors, or if no key
	 * is provided, the ancestors of the current state.
	 */
	*ancestors(key?: Alias, strict: boolean = false)
		: IterableIterator<[Alias, State]>
	{
		let node = key === undefined ? this.curr : this.getNode(key);
		if (!strict) {
			yield [node.id, node.state];
		}
		while (node.parent !== undefined) {
			node = this.nodes.get(node.parent)!;
			yield [node.id, node.state];
		}
	}

	/**
	 * Attempt to get the parent of a state.
	 *
	 * @param key the ID or alias of a state in the tree, or (if not provided)
	 * of the current state.
	 * @returns the parent state ID and object, or null if the state has no
	 * parent.
	 */
	tryParent(key?: Alias): [number, State] | null {
		const node = key === undefined ? this.curr : this.getNode(key);
		const parent = this.getNode(node.parent!)!;
		return node ? [parent.id, parent.state] : null;
	}

	/**
	 * Attempt to get the next sibling after a state.
	 *
	 * @param key the ID or alias of a state in the tree, or (if not provided)
	 * of the current state.
	 * @returns the next sibling state's ID and object, or null if the state
	 * has no next sibling.
	 */
	tryNextSibling(key?: Alias): [number, State] | null {
		const node = key === undefined ? this.curr : this.getNode(key);
		const nextKey = this.getNextSiblingKey(node);
		if (nextKey === undefined) {
			return null;
		}
		const next = this.getNode(nextKey);
		return [next.id, next.state];
	}

	/**
	 * Add a state to the tree.
	 *
	 * @param state the state to add.
	 * @param options options for adding the state. @see {@link AddOptions}.
	 * @param options.alias an optional (unique) alias for the new state.
	 * @param options.children any child states (or their aliases/IDs) to
	 * append to the new state.
	 * @param options.transitions any transitions to add to the new state.
	 */
	add(state: State, options: AddOptions<State, Trigger> = {}): number {
		const node = this.createNode(state, options.alias!);
		if (options.hasOwnProperty('alias')) {
			this.nodes.set(options.alias!, node);
		}
		if (options.children) {
			this.appendChildren(node.id, options.children);
		}
		if (options.transitions) {
			this.onMany(node.id, options.transitions);
		}
		return node.id;
	}

	/**
	 * Add transitions to a state.
	 *
	 * @param key the state's ID or alias.
	 * @param list an array of state transitions.
	 */
	addTransitions(key: Alias, list: Transition<State, Trigger>[]): void {
		const node = this.getNode(key);
		node.transitions = node.transitions.concat(list);
	}

	/**
	 * Append a child to a state.
	 *
	 * @param parentKey the ID or alias of the parent state.
	 * @param child the ID or alias of an existing state, or a new state to
	 * append.
	 * @returns the ID of the child state.
	 * @throws {Error} if the parent or any child state does not exist.
	 */
	appendChild(parentKey: Alias, child: Alias | State): number {
		const parent = this.getNode(parentKey);
		const childNode = this.getOrCreateNode(child);
		parent.children.push(childNode.id);
		childNode.parent = parentKey;
		return childNode.id;
	}

	/**
	 * Append multiple children to a state.
	 *
	 * @param parentKey the ID or alias of the parent state.
	 * @param children IDs or aliases of existing states, or new state objects,
	 * to append to the parent.
	 * @returns the IDs of newly appended children.
	 * @throws {Error} if the parent or any child state does not exist.
	 */
	appendChildren(parentKey: Alias, children: (Alias | State)[]): number[] {
		const parent = this.getNode(parentKey);
		return children.map(child => {
			const childNode = this.getOrCreateNode(child);
			childNode.parent = parent.id;
			parent.children.push(childNode.id);
			return childNode.id;
		});
	}

	/**
	 * Add a transition for a particular state.
	 *
	 * @param key the ID or alias of an existing state.
	 * @throws {Error} if the referred-to state doesn't exist.
	 */
	on(key: Alias, transition: Transition<State, Trigger>): void {
		this.getNode(key).transitions.push(transition);
	}

	/**
	 * Add multiple transitions for a particular state.
	 *
	 * @param key the ID or alias of an existing state.
	 * @param transitions an array of transitions to add.
	 * @throws {Error} if the referred-to state doesn't exist.
	 */
	onMany(key: Alias, transitions: Transition<State, Trigger>[]): void {
		const node = this.getNode(key);
		node.transitions = node.transitions.concat(transitions);
	}

	/**
	 * Jump to another state.
	 *
	 * @param key an alias or ID for the new state.
	 * @param exit an exit strategy for leaving the current state.
	 * @throws {Error} if the referred-to state doesn't exist.
	 */
	jump(
		key: Alias,
		exit: TriggerCallback<State, Trigger>,
		enter: TriggerCallback<State, Trigger>
	)
		: void
	{
		this._jump(key, null, exit, enter);
	}

	/**
	 * Fire a trigger on the current state.
	 *
	 * @param trigger the type of trigger to fire.
	 * @throws {Error} if the current state doesn't have the specified trigger.
	 */
	trigger(trigger: Trigger): void {
		const transition = this.curr.transitions.find(
			tr => tr.trigger === trigger
		);
		if (!transition) {
			return this.onEmptyTransition(trigger, this.current);
		}
		let nextID = (<IDTransition<State, Trigger>> transition).id;
		const rel = (transition as RelationTransition<State, Trigger>).rel;
		if (typeof nextID !== 'number') {
			switch (rel) {
				case Relation.sibling:
				case Relation.siblingElseUp: {
					nextID = this.getNextSiblingKey(this.curr)!;
					if (nextID === undefined) {
						if (rel !== Relation.siblingElseUp) {
							throw new Error("No more siblings");
						}
						nextID = this.curr.parent!;
					}
					break;
				}
				case Relation.parent:
					nextID = this.curr.parent!;
					break;
				case Relation.child:
					nextID = this.curr.children[0];
					break;
				case Relation.same:
					nextID = this.curr.id;
					break;
			}
		}
		this._jump(nextID, trigger, transition.exit, transition.enter);
	}

	/**
	 * Callback used when a trigger is fired for a state which doesn't have it.
	 */
	protected onEmptyTransition(trigger: Trigger, state: State): void {
		throw new Error("No transition for trigger: " + trigger);
	}

	private _jump(
		nextID: Alias,
		trigger: Trigger | null,
		exit: TriggerCallback<State, Trigger> = noop,
		enter: TriggerCallback<State, Trigger> = noop
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
		exit(ev.old, trigger, this);
		enter(ev.new, trigger, this);
		this.postTrigger(ev);
		this.curr = next;
	}

	private getOrCreateNode(arg: Alias | State): Node<State, Trigger> {
		return (typeof arg === 'object'
			?	this.createNode(arg)
			:	this.getNode(arg)
		);
	}

	private createNode(state: State, alias?: PropertyKey)
		: Node<State, Trigger>
	{
		const id = ++idCounter;
		const node = {
			id,
			alias,
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

	private getNextSiblingKey(node: Node<State, Trigger>): Alias | undefined {
		if (node.parent === undefined) {
			return undefined;
		}
		const siblings = this.getNode(node.parent).children;
		const index: number = (node.alias === undefined
			?	siblings.indexOf(node.id)
			:	siblings.findIndex(s => s === node.id || s === node.alias));
		return siblings[index + 1];
	}

	private getParent(key: Alias): Node<State, Trigger> {
		const node = this.getNode(key);
		if (node.parent === undefined) {
			throw new Error(`State ${key} has no parent`);
		}
		return this.getNode(node.parent);
	}
}
