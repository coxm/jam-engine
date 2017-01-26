import {Range, range, combine} from 'jam/util/range';


export type FrameList = Range | (Range | number)[];


export interface AnimationDef {
	/** Frames in this animation. If unspecified, all frames are used. */
	readonly frames?: FrameList;
	/** Whether to concatenate with the rewound animation. */
	readonly rewind?: boolean;
}


export interface SpriteSheetDef {
	readonly image: string | PIXI.Texture;
	readonly frameWidth: number;
	readonly frameHeight: number;
	readonly frameCount: number;
	readonly animations: {
		[id: string]: AnimationDef;
		[id: number]: AnimationDef;
	};
	readonly initial?: string | number;
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
