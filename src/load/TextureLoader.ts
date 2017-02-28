import {FileLoader} from './FileLoader';


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
function loadTextures(paths: string[]): Promise<PIXI.Texture[]> {
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
function fetchTextures(
	paths: string[],
	success: (value: PIXI.Texture[]) => void,
	failure: (value: any) => void
)
	: void
{
	function done(): void {
		success(paths.map(path => PIXI.utils.TextureCache[path]));
	}

	let numRemaining: number = 0;
	function onComplete(): void {
		if (--numRemaining === 0) {
			done();
		}
	}

	for (let url of paths) {
		if (!PIXI.utils.TextureCache[url]) {
			++numRemaining;
			PIXI.loader.add({
				url,
				onComplete,
			});
		}
	}

	// onError missing from definitions.
	(<any> PIXI.loader).onError.add(failure);
	PIXI.loader.load();
}


export class TextureLoader extends FileLoader {
	cached(relpath: string): PIXI.Texture {
		return PIXI.utils.TextureCache[this.abspath(relpath)];
	}

	texture(relpath: string): Promise<PIXI.Texture> {
		return this.textureAbs(this.abspath(relpath));
	}

	textureAbs(abspath: string): Promise<PIXI.Texture> {
		return loadTextures([abspath]).then(textures => textures[0]);
	}

	textures(...relpaths: string[]): Promise<PIXI.Texture[]> {
		return this.texturesAbs(
			...relpaths.map(rel => this.abspath(rel))
		);
	}

	texturesAbs(...abspaths: string[]): Promise<PIXI.Texture[]> {
		return loadTextures(abspaths);
	}
}
