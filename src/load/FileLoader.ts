import {cache} from './cache';

export const parseJSON = JSON.parse.bind(JSON);


export interface FileLoaderOptions {
	baseUrl: string;
	suffix?: string;
}


/**
 * A simple file loader which caches results in the file cache.
 */
export class FileLoader {
	readonly baseUrl: string;
	readonly suffix: string;

	/**
	 * Construct a FileLoader.
	 *
	 * @param options.baseUrl this loader's base URL. All file paths will be
	 * considered relative to the base URL.
	 * @param options.suffix an optional suffix to append when loading files.
	 * Defaults to `'!text.js'`.
	 */
	constructor(options: FileLoaderOptions) {
		this.baseUrl = options.baseUrl.replace(/\/$/, '');
		this.suffix = (typeof options.suffix === 'string'
			? options.suffix
			: '!text.js'
		);
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
		return System.import(this.abspath(relpath) + this.suffix);
	}

	/**
	 * Load a JSON file.
	 *
	 * @param relpath the file path, relative to this loader's base URL.
	 */
	json<T>(relpath: string): Promise<T> {
		return this.text(relpath).then(parseJSON);
	}
}


/** Get the default cache for a file loader. */
export function getDefaultCache(target: FileLoader): Map<string, any> {
	return (<any> target).cache || (
		(<any> target).cache = new Map<string, any>()
	);
}


/**
 * A decorator for caching file load requests.
 *
 * Example usage:
 *
 *     class CachedLoader extends FileLoader {
 *         readonly cache: Map<string, any>;
 *         @cache
 *         text(relpath: string): string {
 *             return super.text(relpath);
 *         }
 *     }
 *     const loader = new CachedLoader({baseUrl: '/base'});
 *     expect(
 *         loader.text('/base/file.txt')
 *     ).toBe(
 *         loader.cache('text:/base/file.txt')  // Note the method and path.
 *     );
 */
export const cacheUnderTypeAndFullPath = cache(
	getDefaultCache,
	function(
		this: FileLoader,
		target: any,
		method: string,
		desc: PropertyDescriptor,
		args: IArguments
	)
		: string
	{
		return `${method}:${this.baseUrl}/${args[0]}`;
	}
);


/**
 * A decorator for caching file load requests.
 *
 * Example usage:
 *
 *     class CachedLoader extends FileLoader {
 *         readonly cache: Map<string, any>;
 *         @cache
 *         text(relpath: string): string {
 *             return super.text(relpath);
 *         }
 *     }
 *     const loader = new CachedLoader({baseUrl: '/base'});
 *     expect(
 *         loader.text('/base/file.txt')
 *     ).toBe(
 *         loader.cache('/base/file.txt')  // Note the full path.
 *     );
 */
export const cacheUnderFullPath = cache(
	getDefaultCache,
	function(
		this: FileLoader,
		target: any,
		method: string,
		desc: PropertyDescriptor,
		args: IArguments
	)
		: string
	{
		return `${this.baseUrl}/${args[0]}`;
	}
);
