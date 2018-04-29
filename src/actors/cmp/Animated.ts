import * as PIXI from 'pixi.js';

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

	/** Check if an animation exists. */
	has(id: number|string): boolean {
		return !!this.anims[id];
	}

	/**
	 * Select an animation.
	 *
	 * @throws Error if the animation doesn't exist.
	 */
	select(id: number|string): void {
		const newAnim = this.anims[id];
		if (newAnim === this.current) {
			return;
		}
		else if (!newAnim) {
			throw new Error(`No '${id}' anim`);
		}
		this.selectClip(newAnim);
	}

	/**
	 * Attempt to select a new animation.
	 *
	 * @returns false if no new animation could be selected, or that animation
	 * is currently being played.
	 */
	trySelect(id: number|string): boolean {
		const newAnim = this.anims[id];
		if (!newAnim || newAnim === this.current) {
			return false;
		}
		this.selectClip(newAnim);
		return true;
	}

	play(): void {
		this.current.play();
	}

	stop(): void {
		this.current.stop();
	}

	private selectClip(clip: PIXI.extras.MovieClip): void {
		const old = this.current;
		clip.position.set(old.position.x, old.position.y);
		clip.rotation = old.rotation;
		this.current = clip;
		if (old.playing) {
			clip.play();
			old.stop();
		}
		if (old.parent) {
			old.parent.addChild(clip);
			old.parent.removeChild(old);
		}
	}
}
