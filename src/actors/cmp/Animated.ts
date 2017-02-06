import {SpriteSheetDef, animations} from 'jam/render/animation';

import {Actor, Component, ComponentDef} from '../Actor';


export interface AnimatedDef extends ComponentDef, SpriteSheetDef {
	readonly factory: 'anim';
	/** The initial animation to show. */
	readonly initial?: string | number;
	/** Optionally prevent the animation from playing on construction. */
	readonly stopped?: boolean;
}


export class Animated implements Component {
	key: string;

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
		this.current = this.anims[initial];
		this.current.play();
	}

	get renderable(): PIXI.extras.MovieClip {
		return this.current;
	}

	select(id: number|string): void {
		if (!this.anims[id]) {
			throw new Error(`No '${id}' anim`);
		}
		const old = this.current;
		if (old.parent) {
			old.parent.addChild(this.anims[id]);
			old.parent.removeChild(old);
		}
		this.current = this.anims[id];
		if (old.playing) {
			old.stop();
			this.current.play();
		}
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
