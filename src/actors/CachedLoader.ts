import {simpleCache} from 'jam/load/cache';
import {ActorDef} from './Actor';

import {Loader} from './Loader';


export class CachedLoader extends Loader {
	@simpleCache
	actorDef(relpath: string): Promise<ActorDef> {
		return super.actorDef(relpath);
	}
}
