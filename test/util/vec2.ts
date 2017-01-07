import {
	dist,
	angleOfLine,
}
from 'jam/util/vec2';


function pimult(n: number): string {
	if (n === 0) {
		return '0';
	}
	if (n === 1) {
		return 'π';
	}
	if (n === -1) {
		return '-π';
	}
	return (n / Math.PI) + 'π';
}


describe("dist", (): void => {
	it("returns the correct distance between points", (): void => {
		expect(dist([0, 0], [1, 1])).toBe(Math.sqrt(2));
	});
});


describe("angleOfLine", (): void => {
	describe("returns the angle of the line", (): void => {
		[
			{src: [100, 100], dest: [100, 200], angle: Math.PI / 2},
			{src: [100, 300], dest: [100, 100], angle: -Math.PI / 2},
			{src: [100, 100], dest: [300, 100], angle: 0},
			{src: [100, 100], dest: [-100, 100], angle: Math.PI},
			{src: [40, 40], dest: [20, 20], angle: -0.75 * Math.PI},
			{src: [100, 100], dest: [200, 200], angle: Math.PI / 4},
		].forEach((obj: any, i: number): void => {
			const {src, dest, angle} = obj;
			it(`(${i}) (${src})->(${dest}) as ${pimult(angle)}`, (): void => {
				const returned = angleOfLine(src, dest);
				const exp = expect(returned);
				exp.toBe(
					angle,
					`Expected ${pimult(returned)} to be ${pimult(angle)}`
				);
			});
		});
	});
}); 
