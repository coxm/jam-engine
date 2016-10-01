import {Actor, ActorDef, Component, ComponentDef} from './Actor';


export interface ComponentFactory {
	/**
	 * @param cmpDef - the component definition.
	 * @param actorID - the unique ID of the owning Actor.
	 * @param actorDef - the owning actor's definition.
	 */
	(cmpDef: ComponentDef, actorID: symbol, actorDef: ActorDef): Component;
}


export class Factory<ActorType> {
	/**
	 * Function used to create ActorType instances.
	 *
	 * The default creates {@link Actor} instances. Can be overwritten to
	 * provide custom actor types.
	 */
	create: (
		actorID: symbol,
		def: ActorDef,
		components: { [id: string]: Component; },
		init: boolean
	) => ActorType;

	private cmpFactories: Map<string, ComponentFactory> = new Map();
	private counter: number = 0;

	/** Set the component factory for a type of component. */
	setCmpFactory(id: string, fn: ComponentFactory): this {
		this.cmpFactories.set(id, fn);
		return this;
	}

	/** Set multiple component factories at a time. */
	setCmpFactories(obj: { [id: string]: ComponentFactory; }): this {
		for (let id in obj) {
			this.cmpFactories.set(id, obj[id]);
		}
		return this;
	}

	/** Create an actor from a definition. */
	actor(def: ActorDef, init: boolean = true): ActorType {
		const actorID: symbol = Symbol(
			def.alias ? this.counter + ':' + def.alias : this.counter
		);

		const components: { [id: string]: Component; } = {};
		for (let i: number = 0, len: number = def.cmp.length; i < len; ++i) {
			const cmpDef: ComponentDef = def.cmp[i];
			components[cmpDef.type] = this.component(cmpDef, actorID, def);
		}

		++this.counter;
		return this.create(actorID, def, components, init);
	}

	component(cmpDef: ComponentDef, actorID: symbol, actorDef: ActorDef)
		:	Component
	{
		const factory: ComponentFactory|undefined =
			this.cmpFactories.get(cmpDef.type);
		if (!factory) {
			throw new Error(`No such component factory: ${cmpDef.type}`);
		}
		return (<ComponentFactory> factory)(cmpDef, actorID, actorDef);
	}
}
Factory.prototype.create = (
	actorID: symbol,
	def: ActorDef,
	components: { [id: string]: Component; },
	init: boolean
): Actor => new Actor(actorID, def, components, init);
