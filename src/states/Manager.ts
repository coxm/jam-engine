import {noop} from '../util/misc';

import {Relation} from './Relation';


export const enum EndCondition {
	none = 0,
	detach = 1,
	end = 2
}


export interface ManagedState {
	readonly name: string;

	start(): Promise<void>;
	end(): void;

	attach(): void;
	detach(): void;
}


export interface TransitionBase<State, Trigger> {
	/** The trigger for this transition. */
	readonly trigger: Trigger;
	/** How to deal with the outgoing state. */
	readonly exit: EndCondition | ((state: State, trigger: Trigger) => void);
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
	readonly id: number | string;
}


export type Transition<S, T> = (
	RelationTransition<S, T> |
	IDTransition<S, T>
);


export interface AddOptions<State, Trigger> {
	readonly children?: number[];
	readonly transitions?: Transition<State, Trigger>[];
}


export function endState(state: ManagedState): void {
	state.end();
}


export function detachState(state: ManagedState): void {
	state.detach();
}


interface InternalTransition<State, Trigger> {
	readonly trigger: Trigger;
	readonly exit: (state: State, trigger: Trigger) => void;
	readonly id?: number;
	readonly rel?: Relation;
}


interface Node<State, Trigger> {
	readonly id: number;
	readonly state: State;
	children: (number | string)[];
	transitions: InternalTransition<State, Trigger>[];
	parent?: number | string;
}


let idCounter: number = -1;


export class Manager<State extends ManagedState, Trigger> {
	private nodes = new Map<number | string, Node<State, Trigger>>();

	private curr: Node<State, Trigger>;

	get current(): State {
		return this.curr.state;
	}

	at(id: number | string): State {
		return this.getNode(id).state;
	}

	add(state: State, options?: AddOptions<State, Trigger>): number {
		const id: number = ++idCounter;
		let children: number[];
		let transitions: InternalTransition<State, Trigger>[];
		if (options) {
			children = options.children ? options.children.slice() : [];
			transitions = (options.transitions
				? options.transitions.map(t => this.createTransition(t))
				: []
			);
		}
		else {
			children = [];
			transitions = [];
		}
		const node: Node<State, Trigger> = {
			id,
			state,
			children,
			transitions,
		};
		this.nodes.set(id, node);
		this.nodes.set(state.name, node);
		return id;
	}

	appendChild(parentID: number | string, childID: number | string): void {
		if (!this.nodes.has(childID)) {
			throw new Error(`No such state: ${childID}`);
		}
		this.getNode(parentID).children.push(childID);
		this.getNode(childID).parent = parentID;
	}

	appendChildren(parentID: number | string, children: (number | string)[])
		: void
	{
		// Exception safety: check all nodes exist first.
		const parent = this.getNode(parentID);
		const childNodes = children.map(id => this.getNode(id));
		for (let child of childNodes) {
			child.parent = parentID;
		}
		parent.children = parent.children.concat(children);
	}

	on(id: number | string, transition: Transition<State, Trigger>): void {
		this.getNode(id).transitions.push(this.createTransition(transition));
	}

	onMany(id: number | string, transitions: Transition<State, Trigger>[])
		: void
	{
		const node = this.getNode(id);
		node.transitions = node.transitions.concat(transitions.map(
			t => this.createTransition(t)
		));
	}

	trigger(trigger: Trigger): Promise<void> {
		try {
			const transition = this.curr.transitions.find(
				tr => tr.trigger === trigger
			);
			if (!transition) {
				return this.onEmptyTransition();
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
			const next: Node<State, Trigger> = this.getNode(nextID);
			transition.exit(this.curr.state, trigger);
			this.curr = next;
			return next.state.start();
		}
		catch (err) {
			return Promise.reject(err);
		}
	}

	onEmptyTransition(): Promise<void> {
		return Promise.resolve();
	}

	private getNode(id: number | string): Node<State, Trigger> {
		const node = this.nodes.get(id);
		if (node) {
			return node;
		}
		throw new Error(`No such state: ${id}`);
	}

	private createTransition(transition: Transition<State, Trigger>)
		: InternalTransition<State, Trigger>
	{
		let exit: (state: State, trigger: Trigger) => void;
		switch (transition.exit) {
			case undefined:
				exit = (
					Relation.child ===
						(<InternalTransition<State, Trigger>> transition).rel
					? detachState
					: endState
				);
				break;
			case EndCondition.none:
				exit = noop;
				break;
			case EndCondition.detach:
				exit = detachState;
				break;
			case EndCondition.end:
				exit = endState;
				break;
			default:
				// Assume it's a function, in which case we keep it.
				exit = transition.exit;
				break;
		}
		return Object.assign({}, transition, {exit});
	}
}
