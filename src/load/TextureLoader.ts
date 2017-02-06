import {FileLoader} from './FileLoader';


export class TextureLoader extends FileLoader {
	cached(relpath: string): PIXI.Texture {
		return PIXI.utils.TextureCache[this.abspath(relpath)];
	}

	texture(relpath: string): Promise<PIXI.Texture> {
		const abspath: string = this.abspath(relpath);
		return new Promise((resolve, reject): void => {
			function done(): void {
				resolve(PIXI.utils.TextureCache[abspath]);
			}

			if (PIXI.utils.TextureCache[abspath]) {
				done();
			}
			else {
				PIXI.loader.add(abspath).load(done);
			}
		});
	}

	textures(...relpaths: string[]): Promise<void> {
		return new Promise((resolve, reject): void => {
			PIXI.loader
			.add(relpaths.map(this.abspath.bind(this)))
			.load(resolve);
		});
	}
}
