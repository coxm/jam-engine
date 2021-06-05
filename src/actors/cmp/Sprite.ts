import * as PIXI from 'pixi.js';

import {Actor, Component} from '../Actor';


export class Sprite implements Component {
	key: string = '';

	readonly renderable: PIXI.Sprite;

	constructor(
		image: PIXI.Texture | PIXI.Sprite,
		public readonly actorID: symbol
	) {
		this.renderable = (image instanceof PIXI.Sprite
			?	image
			:	new PIXI.Sprite(image)
		);
	}

	onAdd(actor: Actor): void {
	}

	onRemove(actor: Actor): void {
	}
}
