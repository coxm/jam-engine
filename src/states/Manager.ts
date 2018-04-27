import {noop} from 'jam/util/misc';

import {Relation} from './Relation';


export type Identifier = number | string | symbol;


export type TriggerCallback<State, Trigger> = (
	ev: TriggerEvent<State, Trigger>,
	manager: Manager<State, Trigger>
) => void;


export interface TransitionBase<State, Trigger> {
	/** The trigger for this transition or `null` if caused by a jump. */
	readonly trigger: Trigger | null;
	/** A callback for shutting down the old state and initialising the new. */
	readonly change?: TriggerCallback<State, Trigger>;
}


/** A transition which explicitly identifies the next state. */
export interface IDTransition<State, Trigger>
	extends TransitionBase<State, Trigger>
{
	/** The ID of the new state. */
	readonly id: Identifier;
}


/** A transition which identifies a state by a relationship. */
export interface RelationTransition<State, Trigger>
	extends TransitionBase<State, Trigger>
{
	/** The relationship between the current state and the new state. */
	readonly rel: Relation;
}


/** A transition which uses a function to identify the next state. */
export interface FinderTransition<State, Trigger>
	extends TransitionBase<State, Trigger>
{
	/** A function which returns an identifier for the next state. */
	readonly find: (
		this: FinderTransition<State, Trigger>,
		id: number,
		state: State,
		manager: Manager<State, Trigger>
	) => Identifier;
}


export type Transition<S, T> = (
	RelationTransition<S, T> |
	IDTransition<S, T> |
	FinderTransition<S, T>
);


type UnionTransition<State, Trigger> = (
	IDTransition<State, Trigger> &
	RelationTransition<State, Trigger> &
	FinderTransition<State, Trigger>
);


/**
 * Options to use when adding a state to a {@link Manager}.
 *
 * @see {@link Manager#add}.
 */
export interface AddOptions<State, Trigger> {
	readonly alias?: PropertyKey;
	readonly children?: (Identifier | State)[];
	readonly transitions?: Transition<State, Trigger>[];
	readonly parent?: Identifier | State;
}


export interface TriggerEventStateInfo<State> {
	readonly state: State;
	readonly id: number;
	readonly alias: PropertyKey | undefined;
}


/** Event passed to transition `change` callbacks. */
export interface TriggerEvent<State, Trigger> {
	/** The trigger that caused the transition (if any). */
	readonly trigger: Trigger | null;
	/** Info on the old state. */
	readonly old: TriggerEventStateInfo<State>;
	/** Info on the new state. */
	readonly new: TriggerEventStateInfo<State>;
}


const isNode: symbol = Symbol('isNode');


interface Node<State, Trigger> {
	readonly id: number;
	readonly alias: PropertyKey | undefined;
	readonly state: State;
	children: number[];
	transitions: Transition<State, Trigger>[];
	parent: Identifier | undefined;
}


let idCounter: number = -1;


export type CreateStateOptions<State, Trigger> = (
	[string | symbol, State] |
	[string | symbol, State, AddOptions<State, Trigger>]
);


export interface ManagerOptions<State, Trigger> {
	readonly initial?: string | symbol;
	readonly states?: CreateStateOptions<State, Trigger>[];
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

	private nodes = new Map<Identifier, Node<State, Trigger>>();
	private list: Node<State, Trigger>[] = [];
	private curr: Node<State, Trigger> = null as any;

	constructor(options: ManagerOptions<State, Trigger> = {}) {
		if (options.states) {
			for (const [alias, state, stateOpts] of options.states as any) {
				this.add(state, Object.assign({}, stateOpts, {
					alias: alias
				}));
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
	setInitial(key: Identifier): void {
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
	id(key: Identifier): number {
		return this.getNode(key).id;
	}

	/**
	 * Get a state, given its alias or ID.
	 *
	 * @returns the state object.
	 * @throws {Error} if the requested state doesn't exist.
	 */
	at(key: Identifier): State {
		return this.getNode(key).state;
	}

	/**
	 * Get the alias of a state, if any.
	 *
	 * @returns the state's alias.
	 * @throws {Error} if the requested state doesn't exist.
	 */
	aliasAt(key: Identifier): string | symbol | undefined {
		return this.getNode(key).alias as string | symbol | undefined;
	}

	/** Check if an alias points to a state. */
	has(key: Identifier): boolean {
		return this.nodes.has(key);
	}

	/**
	 * Check if a state has any children.
	 *
	 * @throws {Error} if the referred-to state doesn't exist.
	 */
	hasChildren(key: Identifier): boolean {
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
	*children(key?: Identifier): IterableIterator<[number, State]> {
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
	*siblings(key?: Identifier): IterableIterator<[number, State]> {
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
	*ancestors(key?: Identifier, strict: boolean = false)
		: IterableIterator<[number, State]>
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
	tryParent(key?: Identifier): [number, State] | null {
		const node = key === undefined ? this.curr : this.getNode(key);
		if (node.parent === undefined) {
			return null;
		}
		const parent = this.getNode(node.parent!)!;
		return [parent.id, parent.state];
	}

	/**
	 * Attempt to get the next sibling after a state.
	 *
	 * @param key the ID or alias of a state in the tree, or (if not provided)
	 * of the current state.
	 * @returns the next sibling state's ID and object, or null if the state
	 * has no next sibling.
	 */
	tryNextSibling(key?: Identifier): [number, State] | null {
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
		if (options.parent !== undefined) {
			this.doSetParent(node, options.parent);
		}
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
	addTransitions(key: Identifier, list: Transition<State, Trigger>[]): void {
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
	appendChild(parentKey: Identifier, child: Identifier | State): number {
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
	appendChildren(parentKey: Identifier, children: (Identifier | State)[])
		:	number[]
	{
		const parent = this.getNode(parentKey);
		return children.map(child => {
			const childNode = this.getOrCreateNode(child);
			childNode.parent = parent.id;
			parent.children.push(childNode.id);
			return childNode.id;
		});
	}

	/**
	 * Set the parent of a state.
	 *
	 * @param child the child state ID or alias.
	 * @param parent the parent ID/alias or a new state to add.
	 */
	setParent(child: Identifier, parent: Identifier | State): number {
		return this.doSetParent(this.getNode(child), parent);
	}

	/**
	 * Add a transition for a particular state.
	 *
	 * @param key the ID or alias of an existing state.
	 * @throws {Error} if the referred-to state doesn't exist.
	 */
	on(key: Identifier, transition: Transition<State, Trigger>): void {
		this.getNode(key).transitions.push(transition);
	}

	/**
	 * Add multiple transitions for a particular state.
	 *
	 * @param key the ID or alias of an existing state.
	 * @param transitions an array of transitions to add.
	 * @throws {Error} if the referred-to state doesn't exist.
	 */
	onMany(key: Identifier, transitions: Transition<State, Trigger>[]): void {
		const node = this.getNode(key);
		node.transitions = node.transitions.concat(transitions);
	}

	/**
	 * Jump to another state.
	 *
	 * @param key an alias or ID for the new state.
	 * @param change a function which performs the state change.
	 * @throws {Error} if the referred-to state doesn't exist.
	 */
	jump(key: Identifier, change: TriggerCallback<State, Trigger>): void {
		this._jump(key, null, change);
	}

	/**
	 * Fire a trigger on the current state.
	 *
	 * @param trigger the type of trigger to fire.
	 * @throws {Error} if the current state doesn't have the specified trigger.
	 */
	trigger(trigger: Trigger): void {
		const trans = this.curr.transitions.find(
			tr => tr.trigger === trigger
		) as UnionTransition<State, Trigger>;
		if (!trans) {
			return this.onEmptyTransition(trigger, this.current);
		}

		this._jump(
			this.getTransitionTarget(trans as UnionTransition<State, Trigger>),
			trigger,
			trans.change
		);
	}

	/**
	 * Callback used when a trigger is fired for a state which doesn't have it.
	 */
	protected onEmptyTransition(trigger: Trigger, state: State): void {
		throw new Error("No transition for trigger: " + trigger);
	}

	private _jump(
		nextID: Identifier,
		trigger: Trigger | null,
		change: TriggerCallback<State, Trigger> = noop
	)
		: void
	{
		const next = this.getNode(nextID);
		const ev = {
			new: {
				state: next.state,
				id: next.id,
				alias: next.alias,
			},
			old: {
				state: this.curr.state,
				id: this.curr.id,
				alias: this.curr.alias,
			},
			trigger: trigger,
		};
		this.preTrigger(ev);
		change(ev, this);
		this.postTrigger(ev);
		this.curr = next;
	}

	private getOrCreateNode(arg: Identifier | State): Node<State, Trigger> {
		return typeof arg === 'object'
			?	this.createNode(arg)
			:	this.getNode(arg);
	}

	private createNode(
		state: State,
		alias?: PropertyKey,
		parent?: Identifier
	)
		: Node<State, Trigger>
	{
		const id = ++idCounter;
		const node = {
			id,
			alias,
			state,
			parent: parent,
			children: [],
			transitions: [],
			[isNode]: true,
		};
		this.nodes.set(id, node);
		this.list.push(node);
		return node;
	}

	private getNode(key: Identifier): Node<State, Trigger> {
		const node = this.nodes.get(key);
		if (node) {
			return node;
		}
		throw new Error(`No such state: ${key}`);
	}

	private getNextSiblingKey(node: Node<State, Trigger>)
		: Identifier | undefined
	{
		if (node.parent === undefined) {
			return undefined;
		}
		const siblings = this.getNode(node.parent).children;
		const index: number = (node.alias === undefined
			?	siblings.indexOf(node.id)
			:	siblings.findIndex(s => s === node.id || s === node.alias));
		return siblings[index + 1];
	}

	private getParent(key: Identifier): Node<State, Trigger> {
		const node = this.getNode(key);
		if (node.parent === undefined) {
			throw new Error(`State ${key} has no parent`);
		}
		return this.getNode(node.parent);
	}

	private doSetParent(
		childNode: Node<State, Trigger>,
		parent: Identifier | State
	)
		: number
	{
		const parentNode = this.getOrCreateNode(parent);
		if (childNode.parent !== undefined) {
			const children = this.getNode(childNode.parent).children;
			children.splice(children.indexOf(childNode.id), 1);
		}
		parentNode.children.push(childNode.id);
		childNode.parent = parentNode.id;
		return parentNode.id;
	}

	private getTransitionTarget(trans: UnionTransition<State, Trigger>)
		:	Identifier
	{
		if (trans.id !== undefined) {
			return trans.id;
		}
		if (trans.find) {
			const nextID = trans.find(this.curr.id, this.curr.state, this);
			if (nextID === undefined) {
				throw new Error("Unable to find transition target");
			}
			return nextID;
		}

		switch ((trans as RelationTransition<State, Trigger>).rel) {
			case undefined:
				throw new Error(
					`Invalid transition: ${trans.trigger} from ${this.curr.id}`
				);
			case Relation.sibling: {
				const nextID = this.getNextSiblingKey(this.curr);
				if (nextID === undefined) {
					throw new Error("No more siblings");
				}
				return nextID;
			}
			case Relation.siblingElseUp: {
				const nextID = this.getNextSiblingKey(this.curr)!;
				return nextID === undefined ? this.curr.parent! : nextID;
			}
			case Relation.parent:
				return this.curr.parent!;
			case Relation.child:
				return this.curr.children[0];
			case Relation.same:
				return this.curr.id;
		}
	}
}
