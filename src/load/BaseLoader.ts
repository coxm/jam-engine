export interface BaseLoaderOptions {
	readonly baseUrl: string;
	readonly suffix?: string;
}


export class BaseLoader {
	readonly baseUrl: string;
	readonly suffix: string;

	/**
	 * Construct a loader.
	 *
	 * @param options.baseUrl this loader's base URL. All file paths will be
	 * considered relative to the base URL.
	 * @param options.suffix an optional suffix to append when loading files.
	 */
	constructor(options: BaseLoaderOptions) {
		this.baseUrl = options.baseUrl.replace(/\/$/, '');
		this.suffix = options.suffix || '';
	}

	/** Expand a relative path to a full path with suffix. */
	expandPath(relpath: string): string {
		return this.baseUrl + relpath.replace(/^\/?/, '/') + this.suffix;
	}
}
