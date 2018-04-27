import {SpriteSheetDef, animations} from 'jam/render/animation';

import {ComponentBase, ComponentDef} from '../Actor';


export interface AnimatedDef extends ComponentDef, SpriteSheetDef {
	/** The initial animation to show. */
	readonly initial?: string | number;
	/** Optionally prevent the animation from playing on construction. */
	readonly stopped?: boolean;
}


export class Animated extends ComponentBase {
	private readonly anims: {
		[id: string]: PIXI.extras.MovieClip;
		[id: number]: PIXI.extras.MovieClip;
	} = {};

	private current: PIXI.extras.MovieClip;

	constructor(def: AnimatedDef, actorID: number) {
		super(actorID);
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
		const newAnim = this.anims[id];
		if (newAnim === this.current) {
			return;
		}
		else if (!newAnim) {
			throw new Error(`No '${id}' anim`);
		}
		const old = this.current;
		if (old.parent) {
			old.parent.addChild(newAnim);
			old.parent.removeChild(old);
		}
		this.current = newAnim;
		if (old.playing) {
			old.stop();
			newAnim.play();
		}
	}

	play(): void {
		this.current.play();
	}

	stop(): void {
		this.current.stop();
	}
}
