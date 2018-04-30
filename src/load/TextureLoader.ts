import {BaseLoader} from './BaseLoader';
import {loadTextures} from './textures';


export class TextureLoader extends BaseLoader {
	cached(relpath: string): PIXI.Texture {
		return PIXI.utils.TextureCache[this.expandPath(relpath)];
	}

	texture(relpath: string): Promise<PIXI.Texture> {
		return this.textureAbs(this.expandPath(relpath));
	}

	textureAbs(abspath: string): Promise<PIXI.Texture> {
		return loadTextures(abspath);
	}

	textures(...relpaths: string[]): Promise<PIXI.Texture[]> {
		return this.texturesAbs(...relpaths.map(rel => this.expandPath(rel)));
	}

	texturesAbs(...abspaths: string[]): Promise<PIXI.Texture[]> {
		return loadTextures(abspaths);
	}
}
