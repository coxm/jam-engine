import {noop} from 'jam/util/misc';
import {loadTextures} from 'jam/load/textures';

import {State} from 'jam/states/State';


export type SpriteLike = PIXI.Texture | PIXI.Sprite;


export type SplashImage = (
	string |
	HTMLImageElement |
	SpriteLike |
	Promise<SpriteLike> |
	(() => SpriteLike) |
	(() => Promise<SpriteLike>)
);


export interface SplashOptions {
	readonly onStart?: (this: Splash, sprite: PIXI.Sprite) => void;
	readonly onStop?: (this: Splash, sprite: PIXI.Sprite) => void;
	readonly autoStop?: Promise<void> | (() => Promise<void>);
}


/** Splash screen state. */
export class Splash extends State<SpriteLike, PIXI.Sprite> {
	readonly image: SplashImage;
	readonly onStart: (sprite: PIXI.Sprite) => void;
	readonly onStop: (sprite: PIXI.Sprite) => void;
	readonly autoStop: null | Promise<void> | (() => Promise<void>);
	private sprite: PIXI.Sprite | null;

	/**
	 * Construct a splash screen state.
	 *
	 * @param options.image the image to show in this splash screen.
	 * @param options.onStart a callback used when the splash starts.
	 * @param options.onStop a callback used when the splash stops.
	 * @param options.autoStop a promise (or function returning a promise)
	 * which will stop this splash on resolving.
	 */
	constructor(image: SplashImage, options: SplashOptions = {}) {
		super();
		this.image = image;
		this.sprite = null;
		this.onStart = options.onStart || noop;
		this.onStop = options.onStop || noop;
		this.autoStop = options.autoStop || null;
	}

	protected doPreload(): SpriteLike | Promise<SpriteLike> {
		switch (typeof this.image) {
			case 'string':
				return loadTextures([this.image as string]).then(
					([texture]) => texture);
			case 'object':
				if (this.image instanceof HTMLImageElement) {
					return new PIXI.Texture(new PIXI.BaseTexture(this.image));
				}
				return this.image as SpriteLike;
			case 'function':
				return (this.image as () => SpriteLike)();
			default:
				throw new Error("Invalid raw image");
		}
	}

	protected doUnload(): void {
		if (typeof this.image === 'string') {
			delete PIXI.utils.TextureCache[this.image];
		}
	}

	protected doInit(img: SpriteLike): PIXI.Sprite {
		return img instanceof PIXI.Sprite ? img : new PIXI.Sprite(img);
	}

	protected doStart(sprite: PIXI.Sprite): PIXI.Sprite {
		this.onStart(this.sprite = sprite);
		const delay = this.autoStop;
		if (delay) {
			const stop = () => this.stop();
			switch (typeof delay) {
				case 'function':
					(delay as () => Promise<void>)().then(stop);
					break;
				case 'object':
					(delay as Promise<void>).then(stop);
					break;
				case 'number':
					setTimeout(stop, delay);
					break;
			}
		}
		return sprite;
	}

	protected doStop(): void {
		this.onStop(this.sprite!);
	}
}