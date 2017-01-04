export interface ComponentDef {
	/** The ID of the factory to use for this component definition. */
	readonly factory: string;
}


export interface Component {
	/**
	 * The key under which this component is stored in an Actor.
	 *
	 * The component will be accessible via `actor.cmp[key]`.
	 */
	readonly key: string;
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
	constructor(public readonly actorID: symbol) {
	}

	onAdd(actor: Actor): void {
	}

	onRemove(actor: Actor): void {
	}
}


export interface PartialActorDef {
	/** An optional alias for this actor, e.g. `'player'`. */
	alias?: string;
	/** An optional list of schemata to base the actor on. */
	depends?: string[] | string;
	/** A list of components comprising the actor. */
	cmp?: ComponentDef[];
	/** The actor's position. */
	position?: AnyVec2;
}


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
 *         depends: ['DefB', 'DefC'],
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
	base?: ActorDef
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

	for (let def of defs) {
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


export class Actor {
	cmp: { [key: string]: Component; } = {};
	readonly alias: string|undefined;
	readonly id: symbol;
	private initialised: { [id: string]: boolean; } = {};

	constructor(
		id: symbol,
		def: ActorDef,
		cmp: { [id: string]: Component; },
		init: boolean
	) {
		this.alias = def.alias;
		this.id = id || Symbol(this.alias);
		this.cmp = cmp || {};
		if (init !== false) {
			this.init();
		}
	}

	setCmp(cmp: Component, init: boolean): void {
		this.cmp[cmp.key] = cmp;
		if (init !== false) {
			cmp.onAdd(this);
		}
	}

	removeCmp(key: string): void {
		if (this.initialised[key]) {
			this.cmp[key].onRemove(this);
		}
		delete this.cmp[key];
		delete this.initialised[key];
	}

	init(): void {
		for (let key in this.cmp) {
			if (!this.initialised[key]) {
				this.cmp[key].onAdd(this);
				this.initialised[key] = true;
			}
		}
	}

	deinit(): void {
		for (let key in this.cmp) {
			if (this.initialised[key]) {
				this.cmp[key].onRemove(this);
				this.initialised[key] = false;
			}
		}
	}

	destroy(): void {
		this.deinit();
		this.cmp = {};
		this.initialised = {};
	}
}
