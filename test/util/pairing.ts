import {pair, depair} from 'jam/util/pairing';


describe("pairing function", (): void => {
	it("pairs natural numbers uniquely", (): void => {
		const pairs = new Map<number, [number, number]>();
		const max = 1000;
		let hasCollision = false;
		let errMsg = '';

		for (let i = 0; i < max; ++i) {
			for (let j = 0; j < max; ++j) {
				const paired = pair(i, j);
				const existing = pairs.get(paired);
				if (existing) {
					hasCollision = true;
					errMsg = `(${i},${j}) collides with (${existing})`;
					break;
				}
				pairs.set(paired, [i, j]);
			}
		}

		expect(hasCollision).toBe(false, errMsg);
	});

	it("can be de-paired", (): void => {
		const max = 1000;

		for (let i = 0; i < max; ++i) {
			for (let j = 0; j < max; ++j) {
				const out = depair(pair(i, j));

				if (i !== out[0] || j !== out[1]) {
					const errMsg =
						`Expected depair(pair(${i}, ${j})) to be [${out}]`;
					expect(i).toBe(out[0], errMsg);
					expect(j).toBe(out[1], errMsg);
				}
			}
		}
	});
});
