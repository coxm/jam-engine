import {ActorDef, PartialActorDef, mergeActorDefs} from './Actor';


type PartialDefLoader = (relpath: string) =>
	PartialActorDef | Promise<PartialActorDef>;


/**
 * A loader for compiling {@link ActorDef}s.
 *
 * Loads {@link ActorDef}s as normal JSON objects, but is able to recursively
 * assemble definitions from {@link PartialActorDef}s with dependencies.
 *
 * If definitions are often loaded recursively, it is recommended to subclass
 * and cache the {@link Loader} method.
 */
export class Loader {
	constructor(protected loadDef: PartialDefLoader) {
	}

	async actorDef(relpath: string): Promise<ActorDef> {
		const def = await this.loadDef(relpath);
		return this.fromPartialDef(def);
	}

	fromPartialDef(root: PartialActorDef): Promise<ActorDef> {
		if (!root.depends) {
			return Promise.resolve(root as ActorDef);
		}
		return Promise.all(
			typeof root.depends === 'string'
				?	[this.actorDef(root.depends)]
				:	root.depends.map(this.actorDef.bind(this))
		)
		.then((defs: PartialActorDef[]): ActorDef => {
			defs.reverse();
			defs.unshift(root);
			return mergeActorDefs(defs);
		});
	}
}
