import {FileLoader} from './FileLoader';


export class TextureLoader extends FileLoader {
	cached(relpath: string): PIXI.Texture {
		return PIXI.utils.TextureCache[this.abspath(relpath)];
	}

	image(relpath: string): Promise<PIXI.Texture> {
		const abspath: string = this.abspath(relpath);
		return new Promise((resolve, reject): void => {
			PIXI.loader.add(abspath).load((): void => {
				resolve(PIXI.utils.TextureCache[abspath]);
			});
		});
	}

	images(...relpaths: string[]): Promise<void> {
		return new Promise((resolve, reject): void => {
			PIXI.loader
			.add(relpaths.map(this.abspath.bind(this)))
			.load(resolve);
		});
	}
}
