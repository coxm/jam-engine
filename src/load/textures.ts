import {Pool} from 'jam/util/Pool';


const pool = new Pool<PIXI.loaders.Loader>({
	create: () => new PIXI.loaders.Loader(),
	reset(loader: PIXI.loaders.Loader) {
		(loader as any).removeAllListeners();
		return loader.reset();
	},
	maxIdle: 3,
});


/**
 * Load an array of textures by absolute path.
 *
 * Uses {@link PIXI.loaders.Loader} instances to load textures.
 *
 * @param paths the array of texture paths.
 * @returns a promise which resolves with the loaded textures.
 */
export const loadTextures = (paths: string[], baseUrl: string = '')
	: Promise<PIXI.Texture[]> =>
{
	const loader = pool.get();
	loader.baseUrl = baseUrl;
	loader.add(paths);
	return new Promise((resolve, reject): void => {
		(loader.on('error', reject) as PIXI.loaders.Loader).load((): void => {
			resolve(paths.map(p => PIXI.utils.TextureCache[p]));
		});
	});
};
