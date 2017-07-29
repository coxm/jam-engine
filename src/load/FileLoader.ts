import {map, iterable} from 'jam/util/iterate';

import {BaseLoader} from './BaseLoader';


export class FileLoader extends BaseLoader {
	/**
	 * Load a raw text file.
	 *
	 * @param relpath the file path, relative to this loader's base URL.
	 */
	text(relpath: string): Promise<string> {
		return fetch(this.expandPath(relpath)).then(res => res.text());
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
		const full = this.expandPath(relpath);
		const res = await fetch(full);
		return res.json().catch(err => {
			const newError = new Error(
				`JSON parse error - '${full}' ('${relpath}'):\n${err.mesage}`);
			(newError as any).originalError = err;
			throw newError;
		});
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
