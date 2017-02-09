import {
	TileObject,
	setRadians,
	angleOf,
	centreOf,
}
from 'jam/util/tiled';


let tiledObjectCounter: number = 0;


interface MinimalTileObject {
	x: number;
	y: number;
	rotation: number;
	width: number;
	height: number;
}


function toTileObject(ob: MinimalTileObject): TileObject {
	const id: number = ++tiledObjectCounter;
	return Object.assign({
		id: id,
		type: '',
		name: `TiledObject_${id}`,
		gid: id,
	}, ob);
}


describe("setRadians", () => {
	it("allows setting the angle via radians", (): void => {
		const x = setRadians({rotation: 90});
		x.radians = Math.PI;
		expect(x.rotation).toBe(180);
		expect(x.radians).toBe(Math.PI);
	});
	it("allows setting the angle via rotation", (): void => {
		const x = setRadians({rotation: 90});
		x.rotation = 180;
		expect(x.rotation).toBe(180);
		expect(x.radians).toBe(Math.PI);
	});
});


describe("angleOf", (): void => {
	it("returns the angle of an object in radians", (): void => {
		const x = {rotation: 45};
		expect(angleOf(x)).toBe(Math.PI / 4);
		expect(angleOf(x)).toBe(Math.PI / 4);
	});
});


describe("centreOf", (): void => {
	describe("returns the centre of a rotated Tiled object", (): void => {
		function testExample(
			input: MinimalTileObject,
			output: AnyVec2,
			exampleID: number
		)
			: void
		{
			it(`(example ${exampleID})`, (): void => {
				const ob = toTileObject(input);
				let out: AnyVec2 = [0, 0];
				centreOf(out, ob);
				expect(out[0]).toBeCloseTo(output[0]);
				expect(out[1]).toBeCloseTo(output[1]);
			});
		}

		const examples: [AnyVec2, MinimalTileObject][] = [
			[
				[296, 176],
				{x: 264, y: 144, rotation: 90, width: 64, height: 64}
			],
			[
				[296, 176],
				{x: 284.29, y: 132.29, rotation: 120, width: 64, height: 64}
			],
			[
				[296, 176],
				{x: 296, y: 130.75, rotation: -225, width: 64, height: 64}
			],
			[
				[296, 176],
				{x: 328, y: 144, rotation: -180, width: 64, height: 64}
			]
		];

		let i: number = 0;
		for (let [output, input] of examples) {
			testExample(input, output, i++);
		}
	});
});
