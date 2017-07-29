import {simpleCache} from './cache';
import {FileLoader} from './FileLoader';


export class CachedFileLoader extends FileLoader {
	readonly cache: Map<string, Promise<string>> = new Map();

	@simpleCache
	text(relpath: string): Promise<string> {
		return super.text(relpath);
	}

	@simpleCache
	json<T>(relpath: string): Promise<T> {
		return super.json(relpath);
	}
}
