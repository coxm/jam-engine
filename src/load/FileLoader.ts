export const parseJSON = JSON.parse.bind(JSON);


export interface FileLoaderOptions {
	baseUrl: string;
	cache: Map<string, any> | boolean;
}


/**
 * A simple file loader which caches results in the file cache.
 */
export class FileLoader {
	readonly baseUrl: string;
	readonly cache: Map<string, any> | null;

	/**
	 * Construct a FileLoader.
	 *
	 * @param options.baseUrl this loader's base URL. All file paths will be
	 * considered relative to the base URL.
	 * @param options.cache this loader's cache: if `undefined`, a new cache
	 * will be constructed specifically for this loader; if `null`, caching
	 * will be prevented; otherwise, the provided value is used as a cache.
	 */
	constructor(options: FileLoaderOptions) {
		this.baseUrl = options.baseUrl.replace(/\/$/, '');
		switch (options.cache) {
			case false:
				this.cache = null;
				break;
			case true:
				this.cache = new Map<string, any>();
				break;
			default:
				this.cache = options.cache;
		}
	}

	/** Make a relative path absolute, using this loader's base URL. */
	abspath(relpath: string): string {
		return this.baseUrl + relpath.replace(/^\/?/, '/');
	}

	/**
	 * Load a raw text file.
	 *
	 * @param relpath the file path, relative to this loader's base URL.
	 */
	text(relpath: string): Promise<string> {
		return this.file(relpath + '!text.js');
	}

	/**
	 * Load a JSON file.
	 *
	 * @param relpath the file path, relative to this loader's base URL.
	 */
	json<T>(relpath: string): Promise<T> {
		return this.file(relpath + '!text.js', parseJSON);
	}

	/**
	 * Get the key for caching a file under.
	 *
	 * Strips any SystemJS plugin extensions (e.g. `'!text.js'`).
	 */
	protected cacheKey(abspath: string): string {
		return abspath.replace(/![a-z]+\.[a-z]+/, '');
	}

	/**
	 * Load a file.
	 *
	 * Stores the result in this loader's cache, if any.
	 * @param relpath the file path, relative to this loader's base URL.
	 * @param parse a parsing function.
	 * @returns a promise which resolves with the file contents, parsed if
	 * `parse` is provided.
	 */
	protected file(
		relpath: string,
		parse?: (content: string) => any
	)
		: Promise<any>
	{
		const importPath = this.abspath(relpath);
		return (this.cache
			? this.cached(importPath, parse)
			: this.uncached(importPath, parse)
		);
	}

	/**
	 * Load a file, caching the result.
	 *
	 * Stores the result in this loader's cache, which is assumed to exist.
	 * @param abspath the full file path.
	 * @param parse a parsing function.
	 * @returns a promise which resolves with the file contents, parsed if
	 * `parse` is provided.
	 */
	protected cached(abspath: string, parse?: (content: string) => any)
		: Promise<any>
	{
		const cacheKey = this.cacheKey(abspath);
		for (let [k, v] of this.cache!.entries()) {
			if (k === cacheKey) {
				return v;
			}
		}

		const promise = this.uncached(abspath, parse);
		this.cache!.set(cacheKey, promise);
		return promise;
	}

	/**
	 * Load a file, without caching the result.
	 *
	 * @param abspath the full file path.
	 * @param parse a parsing function.
	 * @returns a promise which resolves with the file contents, parsed if
	 * `parse` is provided.
	 */
	protected uncached(abspath: string, parse?: (content: string) => any)
		: Promise<any>
	{
		const promise = System.import(abspath);
		return parse ? promise.then(parse) : promise;
	}
}
