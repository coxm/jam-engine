import * as PIXI from 'pixi.js';

import {Range, range, combine} from 'jam/util/range';
import {randInRange, randIntInRange} from 'jam/util/misc';


export interface Randomiser {
	randIn: [number, number];
}


export type FrameList =
	Range | (Range | number)[] | Randomiser | PIXI.Rectangle[];


export type RectDef =
	{x: number; y: number; w: number; h: number} |
	[number, number, number, number] |
	number[];


export type RectLike = RectDef | PIXI.Rectangle;


export interface AnimationDef {
	/** Frames in this animation. If unspecified, all frames are used. */
	frames?: FrameList;
	/**
	 * PIXI.Rectangle instances to use instead of generated frames.
	 */
	rects?: RectLike[];
	/** An optional anchor. Defaults to [0.5, 0.5]. */
	anchor?: AnyVec2;
	/** Whether to concatenate with the rewound animation. */
	rewind?: boolean;
	/** The animation speed. Takes precedence over `randomSpeed`.  */
	speed?: number;
	/** Set a random speed. */
	randomSpeed?: [number, number];
	/** Optional name for this animation. */
	name?: string;
}


export interface SpriteSheetDef {
	name?: string;
	texture: PIXI.Texture | PIXI.BaseTexture;
	frameWidth: number;
	frameHeight: number;
	frameCount: number;
	animations: {
		[id: string]: AnimationDef;
		[id: number]: AnimationDef;
	};
}


export function animations(def: SpriteSheetDef)
	:	Record<string|number, PIXI.AnimatedSprite>
{
	const addName = def.name === undefined
		?	((anim: AnimationDef) => anim)
		:	((anim: AnimationDef, key: string | number): AnimationDef =>
				Object.assign({name: `${def.name}:${key}`}, anim));
	const out: Record<string | number, PIXI.AnimatedSprite> = {};
	for (const key in def.animations) {
		const anim = addName(def.animations[key], key);
		out[key] = animation(
			def.texture, anim, def.frameWidth, def.frameHeight);
	}
	return out;
}


export const createRect = (rct: RectLike) =>
	rct instanceof PIXI.Rectangle ? rct :
		rct instanceof Array
			? new PIXI.Rectangle(rct[0], rct[1], rct[2], rct[3])
			: new PIXI.Rectangle(rct.x, rct.y, rct.w, rct.h);


export function animation(
	base: PIXI.BaseTexture | PIXI.Texture,
	def: AnimationDef,
	frameWidth: number,
	frameHeight: number
)
	: PIXI.AnimatedSprite
{
	let rects: PIXI.Rectangle[];
	if (def.rects) {
		rects = def.rects.map(createRect);
	}
	else if (def.frames) {
		rects = def.rects || [...frames(
			def.frames,
			frameWidth,
			frameHeight,
			base.width,
			base.height
		)];
	}
	else {
		throw new Error("AnimationDef has no frames or rects");
	}

	if (def.rewind) {
		for (let i: number = rects.length - 1; 0 <= i; --i) {
			rects.push(rects[i]);
		}
	}

	const baseTexture: PIXI.BaseTexture = (base instanceof PIXI.Texture)
		?	base.baseTexture
		:	base;
	const textures: PIXI.Texture[] = rects.map(
		(rect: PIXI.Rectangle) => new PIXI.Texture(baseTexture, rect));
	const anim = new PIXI.AnimatedSprite(textures);
	if (def.name !== undefined) {
		anim.name = def.name;
	}

	if (def.anchor) {
		anim.anchor.set(def.anchor[0], def.anchor[1]);
	}
	else {
		anim.anchor.set(0.5, 0.5);
	}

	if (typeof def.speed === 'number') {
		anim.animationSpeed = def.speed;
	}
	else if (def.randomSpeed) {
		anim.animationSpeed = randInRange(
			def.randomSpeed[0], def.randomSpeed[1]);
	}

	return anim;
}


export function* frames(
	ranges: FrameList | undefined | null,
	frameWidth: number,
	frameHeight: number,
	imageWidth: number,
	imageHeight: number
)
	:	IterableIterator<PIXI.Rectangle>
{
	let iter: Iterable<number>;
	if (!ranges) {
		iter = range({
			beg: 0,
			pre: (imageWidth / frameWidth) * (imageHeight / frameHeight),
		});
	}
	else if ((ranges as Randomiser).randIn) {
		iter = [randIntInRange(
			(ranges as Randomiser).randIn[0],
			(ranges as Randomiser).randIn[1])];
	}
	else if ((ranges as Iterable<Range | number>)[Symbol.iterator]) {
		iter = combine(ranges as Iterable<Range | number>);
	}
	else {
		iter = range(ranges as Range);
	}

	for (const index of iter) {
		const xStart: number = frameWidth * index;
		yield new PIXI.Rectangle(
			xStart % imageWidth,
			((xStart / imageWidth) | 0) * frameHeight,
			frameWidth,
			frameHeight
		);
	}
}
