import * as PIXI from 'pixi.js';

import {Pool} from 'jam/util/Pool';


const pool = new Pool<PIXI.loaders.Loader>({
	create: () => new PIXI.loaders.Loader(),
	reset(loader: PIXI.loaders.Loader) {
		(loader as any).removeAllListeners();
		return loader.reset();
	},
});


/**
 * Load an array of textures by absolute path.
 *
 * Uses {@link PIXI.loaders.Loader} instances to load textures.
 *
 * @param paths the array of texture paths.
 * @returns a promise which resolves with the loaded textures.
 */
export const loadTextures: {
	(path: string, baseUrl?: string): Promise<PIXI.Texture>;
	(paths: string[], baseUrl?: string): Promise<PIXI.Texture[]>;
} = (requested: string|string[], baseUrl: string = ''): Promise<any> => {
	const paths: string[] = Array.prototype.concat(requested as any);
	const cache = PIXI.utils.TextureCache;
	if (!paths.some((path: string) => !cache[path])) {
		return Promise.resolve(paths.map((path: string) => cache[path]));
	}

	const loader = pool.get();
	loader.baseUrl = baseUrl;
	loader.add(paths.filter((path: string) => !cache[path]));
	return new Promise((resolve, reject): void => {
		(loader.on('error', reject) as PIXI.loaders.Loader).load((): void => {
			resolve(typeof requested === 'string'
				? PIXI.utils.TextureCache[requested]
				: paths.map((path: string) => PIXI.utils.TextureCache[path]));
		});
	});
};
