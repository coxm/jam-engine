import * as PIXI from 'pixi.js';

import {Actor, Component} from '../Actor';


export class MultiRender implements Component {
	key: string = '';

	readonly renderable: PIXI.Container;

	constructor(
		children: PIXI.DisplayObject[],
		public readonly actorID: symbol
	) {
		this.renderable = new PIXI.Container();
		for (let i = 0, len = children.length; i < len; ++i) {
			this.renderable.addChild(children[i]);
		}
	}

	onAdd(actor: Actor): void {
	}

	onRemove(actor: Actor): void {
	}
}
