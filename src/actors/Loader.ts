import {FileLoader} from 'jam/load/FileLoader';

import {ActorDef, PartialActorDef, mergeActorDefs} from './Actor';


/**
 * A loader for compiling {@link ActorDef}s.
 *
 * Loads {@link ActorDef}s as normal JSON objects, but is able to recursively
 * assemble definitions from {@link PartialActorDef}s with dependencies.
 *
 * If definitions are often loaded recursively, it is recommended to subclass
 * and cache the {@link Loader#json} method.
 */
export class Loader extends FileLoader {
	actorDef(relpath: string): Promise<ActorDef> {
		return this.json(relpath).then(this.fromPartialDef.bind(this));
	}

	fromPartialDef(root: PartialActorDef): Promise<ActorDef> {
		if (!root.depends) {
			return Promise.resolve(root);
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
