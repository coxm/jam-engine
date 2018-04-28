import * as PIXI from 'pixi.js';

import {Range, range, combine} from 'jam/util/range';
import {dictMap, randInRange} from 'jam/util/misc';


export type FrameList = Range | (Range | number)[];


export interface AnimationDef {
	/** Frames in this animation. If unspecified, all frames are used. */
	frames?: FrameList;
	/** An optional anchor. Defaults to [0.5, 0.5]. */
	anchor?: AnyVec2;
	/** Whether to concatenate with the rewound animation. */
	rewind?: boolean;
	/** The animation speed. Takes precedence over `randomSpeed`.  */
	speed?: number;
	/** Set a random speed. */
	randomSpeed?: [number, number];
}


export interface SpriteSheetDef {
	texture: PIXI.Texture;
	frameWidth: number;
	frameHeight: number;
	frameCount: number;
	animations: {
		[id: string]: AnimationDef;
		[id: number]: AnimationDef;
	};
}


export function animations(def: SpriteSheetDef)
	:	{
		[key: string]: PIXI.extras.AnimatedSprite;
		[key: number]: PIXI.extras.AnimatedSprite;
	}
{
	return dictMap(
		{},
		def.animations,
		(anim: AnimationDef) => animation(
			def.texture, anim, def.frameWidth, def.frameHeight)
	);
}


export function animation(
	texture: PIXI.Texture,
	def: AnimationDef,
	frameWidth: number,
	frameHeight: number
)
	: PIXI.extras.AnimatedSprite
{
	const rects: PIXI.Rectangle[] = [...frames(
		def.frames,
		frameWidth,
		frameHeight,
		texture.width,
		texture.height
	)];
	if (def.rewind) {
		for (let i: number = rects.length - 1; 0 <= i; --i) {
			rects.push(rects[i]);
		}
	}

	const anim = new PIXI.extras.AnimatedSprite(
		rects.map(
			(rect: PIXI.Rectangle) => new PIXI.Texture(<any> texture, rect)
		)
	);

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
	if (!ranges) {
		ranges = <Range> {
			beg: 0,
			pre: (imageWidth / frameWidth) * (imageHeight / frameHeight),
		};
	}

	const iter = ((<Iterable<Range | number>> ranges)[Symbol.iterator]
		?	combine(<Iterable<number | Range>> ranges)
		:	range(<Range> ranges)
	);

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
