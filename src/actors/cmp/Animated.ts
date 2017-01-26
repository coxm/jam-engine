import {SpriteSheetDef, animations} from 'jam/render/animation';

import {Actor, Component, ComponentDef} from '../Actor';


export interface AnimatedDef extends ComponentDef, SpriteSheetDef {
	readonly factory: 'anim';
	/** The initial animation to show. */
	readonly initial?: string | number;
}


export class Animated implements Component {
	readonly key: string;

	private readonly anims: {
		[id: string]: PIXI.extras.MovieClip;
		[id: number]: PIXI.extras.MovieClip;
	} = {};

	private current: PIXI.extras.MovieClip;

	constructor(def: AnimatedDef, public readonly actorID: symbol) {
		this.anims = animations(def);
		let initial: any = def.initial;
		if (initial === undefined) {
			for (initial in def.animations) {
				break;
			}
		}
		this.select(initial);
	}

	get graphics(): PIXI.extras.MovieClip {
		return this.current;
	}

	select(id: number|string): void {
		if (!this.anims[id]) {
			throw new Error("No '${id}' anim");
		}
		this.current = this.anims[id];
	}

	play(): void {
		this.current.play();
	}

	stop(): void {
		this.current.stop();
	}

	onAdd(actor: Actor): void {
	}

	onRemove(actor: Actor): void {
	}
}
(<any> Animated.prototype).key = 'anim';
