import {Range, range, combine} from 'jam/util/range';
import {dictMap} from 'jam/util/misc';


export type FrameList = Range | (Range | number)[];


export interface AnimationDef {
	/** Frames in this animation. If unspecified, all frames are used. */
	readonly frames?: FrameList;
	/** Whether to concatenate with the rewound animation. */
	readonly rewind?: boolean;
}


export interface SpriteSheetDef {
	readonly texture: PIXI.Texture;
	readonly frameWidth: number;
	readonly frameHeight: number;
	readonly frameCount: number;
	readonly animations: {
		[id: string]: AnimationDef;
		[id: number]: AnimationDef;
	};
}


export function animations(def: SpriteSheetDef)
	:	{
		[key: string]: PIXI.extras.MovieClip;
		[key: number]: PIXI.extras.MovieClip;
	}
{
	return dictMap(
		(anim: AnimationDef) => animation(
			def.texture, anim, def.frameWidth, def.frameHeight
		),
		def.animations
	);
}


export function animation(
	texture: PIXI.Texture,
	def: AnimationDef,
	frameWidth: number,
	frameHeight: number
)
	: PIXI.extras.MovieClip
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
	return new (<any> PIXI.extras).MovieClip(
		rects.map(
			(rect: PIXI.Rectangle) => new PIXI.Texture(<any> texture, rect)
		)
	);
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

	for (let index of iter) {
		const xStart: number = frameWidth * index;
		yield new PIXI.Rectangle(
			xStart % imageWidth,
			((xStart / imageWidth) | 0) * frameHeight,
			frameWidth,
			frameHeight
		);
	}
}
