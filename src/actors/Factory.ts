import {Actor, ActorDef, Component, ComponentDef} from './Actor';


export interface ComponentFactory<Def = unknown> {
	/**
	 * @param cmpDef - the component definition.
	 * @param actorID - the unique ID of the owning Actor.
	 * @param actorDef - the owning actor's definition.
	 */
	(cmpDef: Def, actorID: number, actorDef: ActorDef): Component;
}


/**
 * The ECS factory class.
 *
 * @see {@link docs/examples/actors.ts} for examples.
 */
export class Factory<ActorType> {
	private cmpFactories: Map<string, ComponentFactory<unknown>> = new Map();
	private numActors: number = 0;

	/**
	 * Function used to create ActorType instances.
	 *
	 * The default creates {@link Actor} instances. Can be overwritten to
	 * provide custom actor types, or add event hooks.
	 */
	create(
		actorID: number,
		def: ActorDef,
		components: { [id: string]: Component; },
		init: boolean
	)
		:	ActorType
	{
		return new Actor(actorID, def, components, init) as any;
	}

	/** Function used to determine the key for constructed components. */
	getCmpKey(cmpDef: ComponentDef, cmp: Component): string {
		if (!cmpDef.key) {
			throw new Error("Can't determine key for component");
		}
		return cmpDef.key;
	}

	/** Set the component factory for a type of component. */
	setCmpFactory<Def extends ComponentDef>(
		id: string,
		fn: ComponentFactory<Def>
	)
		: this
	{
		this.cmpFactories.set(id, fn as ComponentFactory);
		return this;
	}

	/** Set multiple component factories at a time. */
	setCmpFactories<Def extends ComponentDef>(
		obj: { [id: string]: ComponentFactory; }
	)
		: this
	{
		for (const id in obj) {
			this.cmpFactories.set(id, obj[id] as ComponentFactory);
		}
		return this;
	}

	/** Get a new Actor ID. */
	getNewID(): number {
		return this.numActors;
	}

	/** Get the number of actors created by this Factory. */
	get count(): number {
		return this.numActors;
	}

	/** Create an actor from a definition. */
	actor(def: ActorDef, init: boolean = true): ActorType {
		const actorID: number = this.getNewID();
		const components: { [id: string]: Component; } = {};
		for (let i: number = 0, len: number = def.cmp.length; i < len; ++i) {
			const cmpDef: ComponentDef = def.cmp[i];
			const cmp: Component = this.component(cmpDef, actorID, def);
			const key: string = this.getCmpKey(cmpDef, cmp);
			if (components[key]) {
				throw new Error(`Duplicated component key "${key}"`);
			}
			components[key] = cmp;
		}

		++this.numActors;
		return this.create(actorID, def, components, init);
	}

	component(cmpDef: ComponentDef, actorID: number, actorDef: ActorDef)
		:	Component
	{
		const factory: ComponentFactory|undefined =
			this.cmpFactories.get(cmpDef.factory);
		if (!factory) {
			throw new Error(`No such component factory: ${cmpDef.factory}`);
		}
		return (<ComponentFactory> factory)(cmpDef, actorID, actorDef);
	}
}
