export interface ComponentDef {
	/** The ID of the factory to use for this component definition. */
	factory: string;
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


export interface ActorDef {
	alias?: string;
	schema?: string;
	cmp: ComponentDef[];
	position: [number, number];
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
