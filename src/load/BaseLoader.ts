import {resolve} from 'jam/util/url';


export interface BaseLoaderOptions {
	readonly baseUrl: string;
	readonly defaultExtension?: string;
}


export class BaseLoader {
	readonly baseUrl: string;
	readonly defaultExtension: string;

	/**
	 * Construct a loader.
	 *
	 * @param options.baseUrl this loader's base URL. All file paths will be
	 * considered relative to the base URL.
	 * @param options.defaultExtension an optional default extension to append
	 * when loading files.
	 */
	constructor(options?: BaseLoaderOptions) {
		if (options) {
			this.baseUrl = options.baseUrl.replace(/\/$/, '/');
			this.defaultExtension = options.defaultExtension || '';
		}
		else {
			this.baseUrl = this.defaultExtension = '';
		}
	}

	/** Expand a relative path to a full path with extension. */
	expandPath(relpath: string): string {
		if (this.defaultExtension && !/\.[a-zA-Z0-9]+$/.test(relpath)) {
			relpath += this.defaultExtension;
		}
		return resolve(this.baseUrl, relpath);
	}
}
