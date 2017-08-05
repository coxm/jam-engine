/**
 * Load an array of textures by absolute path.
 *
 * Uses {@link PIXI.loader} to load textures, but waits until the current load
 * batch (if any) has finished, to avoid conflicts (`ResourceLoader` throws an
 * error otherwise).
 *
 * @param paths the array of texture paths.
 * @returns a promise which resolves with the loaded textures.
 */
export function loadTextures(paths: string[]): Promise<PIXI.Texture[]> {
	return new Promise((resolve, reject): void => {
		if (!PIXI.loader.loading) {
			return fetchTextures(paths, resolve, reject);
		}

		(<any> PIXI.loader).onComplete.add(
			fetchTextures.bind(null, paths, resolve, reject)
		);
	});
}


/**
 * Fetch an array of textures using {@link PIXI.loader}.
 *
 * @param paths the texture paths.
 * @param success the success callback.
 * @param failure the failure callback.
 */
export function fetchTextures(
	paths: string[],
	success: (value: PIXI.Texture[]) => void,
	failure: (value: any) => void
)
	: void
{
	const loader = new PIXI.loaders.Loader();

	for (const url of paths) {
		if (!PIXI.utils.TextureCache[url]) {
			loader.add(url);
		}
	}

	(<PIXI.loaders.Loader>
		loader
		.once('error', failure)
		.once('complete', () => success(
			paths.map(p => PIXI.utils.TextureCache[p])
		))
	)
	.load();
}
