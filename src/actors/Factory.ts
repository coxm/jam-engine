import {Actor, ActorDef, Component, ComponentDef} from './Actor';


export interface ComponentFactory {
	(actorDef: ActorDef, cmpDef: ComponentDef): Component;
}


export class Factory {
	private cmpFactories: Map<string, ComponentFactory> = new Map();

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
	actor(def: ActorDef, init: boolean = true): Actor {
		const components: { [id: string]: Component; } = {};
		for (let i: number = 0, len: number = def.cmp.length; i < len; ++i) {
			const cmpDef: ComponentDef = def.cmp[i];
			components[cmpDef.type] = this.component(def, cmpDef);
		}
		return new Actor(def, components, init);
	}

	component(actorDef: ActorDef, cmpDef: ComponentDef): Component {
		const factory: ComponentFactory|undefined =
			this.cmpFactories.get(cmpDef.type);
		if (!factory) {
			throw new Error(`No such component factory: ${cmpDef.type}`);
		}
		return (<ComponentFactory> factory)(actorDef, cmpDef);
	}
}
