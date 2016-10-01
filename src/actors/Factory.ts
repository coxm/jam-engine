import {Actor, ActorDef, Component, ComponentDef} from './Actor';


export interface ComponentFactory {
	(def: ComponentDef): Component;
}


export class Factory {
	private cmpFactories: Map<string, ComponentFactory> = new Map();

	/** Set the component factory for a type of component. */
	setCmpFactory(id: string, fn: ComponentFactory): void {
		this.cmpFactories.set(id, fn);
	}

	/** Create an actor from a definition. */
	actor(def: ActorDef, init: boolean = true): Actor {
		const components: { [id: string]: Component; } = {};
		for (let i: number = 0, len: number = def.cmp.length; i < len; ++i) {
			const cmpDef: ComponentDef = def.cmp[i];
			components[cmpDef.type] = this.component(cmpDef);
		}
		return new Actor(def, components, init);
	}

	component(def: ComponentDef): Component {
		const factory: ComponentFactory|undefined =
			this.cmpFactories.get(def.type);
		if (!factory) {
			throw new Error(`No such component factory: ${def.type}`);
		}
		return (<ComponentFactory> factory)(def);
	}
}
