import {frames, FrameList} from 'jam/render/animation';


const frameWidth: number = 32;
const frameHeight: number = 16;
const imageWidth: number = 3 * frameWidth;
const imageHeight: number = 3 * frameHeight;


describe("frames", (): void => {
	function testFrames(ranges: FrameList | null, positions: Vec2[]): void {
		const rectangles = [...frames(
			ranges,
			frameWidth, frameHeight,
			imageWidth, imageHeight
		)];

		expect(rectangles.length).toBe(positions.length);
		for (let r of rectangles) {
			expect(r.width).toBe(frameWidth);
			expect(r.height).toBe(frameHeight);
		}

		expect(rectangles.map(r => [r.x, r.y])).toEqual(positions);
	}

	let positions: Vec2[] = [];
	beforeEach((): void => {
		positions = [
			// Row 0.
			[0, 0],
			[frameWidth, 0],
			[frameWidth * 2, 0],

			// Row 1.
			[0, frameHeight],
			[frameWidth, frameHeight],
			[frameWidth * 2, frameHeight],

			// Row 2.
			[0, frameHeight * 2],
			[frameWidth, frameHeight * 2],
			[frameWidth * 2, frameHeight * 2]
		];
	});

	it("returns all frames in the image if ranges is falsey", (): void => {
		testFrames(null, positions);
	});

	describe("returns a new frame for every index in", (): void => {
		beforeEach((): void => {
			// Positions for the range [2, 6] (including 6).
			positions = positions.filter((pos: Vec2, i: number): boolean => (
				2 <= i && i <= 6
			));
		});

		it("an interval range", (): void => {
			testFrames({beg: 2, pre: 7}, positions);
		});
		it("a length range", (): void => {
			testFrames({beg: 2, len: 5}, positions);
		});
	});

	it("returns a new frame for every index in a frame list", (): void => {
		testFrames(
			[
				// 1, 2, 4, 6, 7.
				{beg: 1, pre: 3},
				4,
				{beg: 6, len: 2}
			],
			[1, 2, 4, 6, 7].map(i => positions[i])
		);
	});
});
