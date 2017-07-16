import {map, iterable} from 'jam/util/iterate';

import {cache} from './cache';


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
	 * Load multiple text files.
	 *
	 * @param relpaths the file paths, relative to this loader's base URL.
	 */
	texts(...relpaths: string[]): Promise<string[]>;
	texts(): Promise<string[]> {
		return Promise.all(
			map(iterable(arguments), (rel: string) => this.text(rel))
		);
	}

	/**
	 * Load a JSON file.
	 *
	 * @param relpath the file path, relative to this loader's base URL.
	 */
	async json<T>(relpath: string): Promise<T> {
		const text: string = await this.text(relpath);
		try {
			return JSON.parse(text) as T;
		}
		catch (err) {
			const newError = new Error(
				`Failed to parse JSON from '${relpath}'`);
			(newError as any).originalError = err;
			throw newError;
		}
	}

	/**
	 * Load multiple JSON files.
	 *
	 * @param relpaths the file paths, relative to this loader's base URL.
	 */
	jsons<T>(...relpaths: string[]): Promise<T[]>;
	jsons<T>(): Promise<T[]> {
		return Promise.all(
			map(iterable(arguments), (rel: string) => this.json<T>(rel))
		);
	}
}


/** Get the default cache for a file loader. */
export function getDefaultCache(this: FileLoader): Map<string, any> {
	return (<any> this).cache || (
		(<any> this).cache = new Map<string, any>()
	);
}


/**
 * A decorator for caching file load requests.
 *
 * @example
 * class CachedLoader extends FileLoader {
 *     readonly cache: Map<string, any>;
 *     @cacheUnderTypeAndFullPath
 *     text(relpath: string): string {
 *         return super.text(relpath);
 *     }
 * }
 * const loader = new CachedLoader({baseUrl: '/base'});
 * expect(
 *     loader.text('/base/file.txt')
 * ).toBe(
 *     loader.cache('text:/base/file.txt')  // Note the method and path.
 * );
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
 * @example
 * class CachedLoader extends FileLoader {
 *     readonly cache: Map<string, any>;
 *     @cacheUnderFullPath
 *     text(relpath: string): string {
 *         return super.text(relpath);
 *     }
 * }
 * const loader = new CachedLoader({baseUrl: '/base'});
 * expect(
 *     loader.text('/base/file.txt')
 * ).toBe(
 *     loader.cache('/base/file.txt')  // Note the full path.
 * );
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
