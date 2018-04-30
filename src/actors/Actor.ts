/**
 * @file src/actors/Actor.ts
 *
 * Here the core parts of Jam's entity-component system are defined.
 * @see {@link src/actors/Factory.ts} also.
 */


/** The base interface for a component definition. */
export interface ComponentDef {
	/** Optionally specify a type key for this component. */
	readonly key?: string;
	/** The ID of the factory to use for this component definition. */
	readonly factory: string;
}


/** The base interface for a component object. */
export interface Component {
	/** Add this component to an actor. */
	onAdd(actor: Actor): void;
	/** Remove this component from an actor. */
	onRemove(actor: Actor): void;
}


/**
 * Optional base class for components.
 *
 * Extending `ComponentBase` is not required, but can be useful if not defining
 * `onAdd` and `onRemove` methods.
 */
export class ComponentBase {
	constructor(public readonly actorID: number) {
	}

	onAdd(actor: Actor): void {
	}

	onRemove(actor: Actor): void {
	}
}


/** Interface for actor definitions. */
export interface ActorDef {
	/** An optional alias for this actor, e.g. `'player'`. */
	alias?: string;
	/** An optional list of schemata to base the actor on. */
	depends?: string[] | string;
	/** A list of components comprising the actor. */
	cmp: ComponentDef[];
	/** The actor's position. */
	position: AnyVec2;
}


export type PartialActorDef = Partial<ActorDef>;


/**
 * Merge an iterable of actor definitions into one.
 *
 * Assumes the iterable is sorted from highest to lowest priority: if `def1`
 * preceeds `def2` (i.e. `def1` is intended to extend `def2`) then properties
 * of `def1` will take precedence over those of `def2`.
 *
 * @param defs an iterable of {@link ActorDef}s.
 * @param base an optional base definition to start with, of least priority.
 * This object is used before any from `defs`, and its properties will be
 * overwritten.
 * @returns an actor def with merged properties. The returned component array
 * entries of earlier {@link ActorDef}s appear after those of later
 * definitions, since the former may depend on the latter. Dependencies are
 * concatenated in the order they are seen.
 *
 * @example
 * const def = mergeActorDefs([
 *     { // Top-level actor definition.
 *         cmp: [{factory: 'Factory3'}],
 *         depends: ['DefB'],
 *     },
 *     { // Required by first definition but requires the next one.
 *         alias: 'DefB',
 *         depends: ['DefC'],
 *     },
 *     { // Most fundamental def: components 
 *         alias: 'DefC',
 *         cmp: [{factory: 'Factory1'}, {factory: 'Factory2'}],
 *     }
 * ]);
 * expect(def).toEqual({
 *     alias: 'DefB',
 *     cmp: [
 *         {factory: 'Factory1'},
 *         {factory: 'Factory2'},
 *         {factory: 'Factory3'}
 *     ],
 *     depends: ['DefB', 'DefC'],
 * });
 */
export function mergeActorDefs(
	defs: Iterable<PartialActorDef>,
	base?: PartialActorDef
)
	: ActorDef
{
	if (!base) {
		base = <ActorDef> {};
	}
	let alias = base.alias || '';
	let position: AnyVec2 = <AnyVec2> base.position || null;
	let cmp: ComponentDef[] = [];
	let depends: string[] = [];

	for (const def of defs) {
		if (!alias && def.alias) {
			alias = def.alias;
		}
		if (!position && def.position) {
			position = def.position;
		}
		if (def.cmp) {
			cmp = def.cmp.concat(cmp);
		}
		if (def.depends) {
			depends = depends.concat(def.depends);
		}
	}

	return {
		alias,
		position: position || [0, 0],
		cmp,
		depends,
	};
}


/**
 * Component container class.
 *
 * The 'entity' class in the ECS.
 */
export class Actor {
	readonly cmp: { [key: string]: Component; } = {};
	readonly alias: string|undefined;
	readonly id: number;

	private initialised: { [id: string]: boolean; } = {};

	/**
	 * Construct an Actor.
	 *
	 * @param id the actor's ID.
	 * @param def the definition this Actor was constructed with.
	 * @param cmp the components dict.
	 * @param init (default: `true`) whether to initialise the Actor.
	 */
	constructor(
		id: number,
		def: ActorDef,
		cmp: { [id: string]: Component; },
		init?: boolean
	) {
		this.cmp = cmp || {};
		this.alias = def.alias;
		this.id = id;
		if (init !== false) {
			this.init();
		}
	}

	/**
	 * Set a particular component on this Actor.
	 *
	 * @param cmp the component to set.
	 * @param init whether to initialise the component.
	 * @throws Error if a component of the same key already exists.
	 */
	setCmp(key: string, cmp: Component, init: boolean = true): void {
		if (this.cmp[key]) {
			throw new Error("Component exists: " + key);
		}

		if (init) {
			cmp.onAdd(this);
		}
		this.cmp[key] = cmp;
		this.initialised[key] = init;
	}

	/**
	 * Remove a particular component from this Actor.
	 *
	 * Calls the component's `onRemove` method first.
	 *
	 * @param key the key under which the component is stored.
	 */
	deleteCmp(key: string): void {
		if (this.initialised[key]) {
			this.cmp[key].onRemove(this);
		}
		delete this.cmp[key];
		delete this.initialised[key];
	}

	/**
	 * Call the `onAdd` method of every component.
	 *
	 * Components which have already been initialised in this way will not be
	 * re-initialised.
	 */
	init(): void {
		for (const key in this.cmp) {
			if (!this.initialised[key]) {
				this.cmp[key].onAdd(this);
				this.initialised[key] = true;
			}
		}
	}

	/** Un-initialise all components by calling their `onRemove` methods. */
	deinit(): void {
		for (const key in this.cmp) {
			if (this.initialised[key]) {
				this.cmp[key].onRemove(this);
				this.initialised[key] = false;
			}
		}
	}

	/** Check if a particular component has been initialised. */
	isInitialised(key: string): boolean {
		return !!this.initialised[key];
	}

	/** Destroy this Actor, resetting the component dict. */
	destroy(): void {
		this.deinit();
		(<any> this).cmp = {};
		this.initialised = {};
	}
}
