import {Body, Shape} from 'p2';

import * as mod from 'jam/physics/body';


describe("BodyType enum", (): void => {
	it("is defined correctly", (): void => {
		expect(mod.BodyType.dynamic).toBe(Body.DYNAMIC);
		expect(mod.BodyType.static).toBe(Body.STATIC);
		expect(mod.BodyType.kinematic).toBe(Body.KINEMATIC);
	});
});


describe("convert dict", (): void => {
	it("is configured correctly", (): void => {
		const checks = <[string, string, number][]> [
			['DYNAMIC', 'dynamic', Body.DYNAMIC],
			['KINEMATIC', 'kinematic', Body.KINEMATIC],
			['STATIC', 'static', Body.STATIC],
		];
		for (let [lower, upper, type] of checks) {
			expect(mod.convert[lower]).toBe(type);
			expect(mod.convert[upper]).toBe(type);
			expect(mod.convert[type]).toBe(type);
		}
	});
});


describe("create function", (): void => {
	it("accepts regular BodyOptions", (): void => {
		const body = mod.create({
			type: Body.STATIC,
			position: [1, 2],
		});
		expect(body.type).toBe(Body.STATIC);
		expect(body.position[0]).toBe(1);
		expect(body.position[1]).toBe(2);
	});
	it("converts types if necessary", (): void => {
		const body = mod.create({
			type: 'static',
			position: [1, 2],
		});
		expect(body.type).toBe(Body.STATIC);
		expect(body.position[0]).toBe(1);
		expect(body.position[1]).toBe(2);
	});
	it("adds shapes if definitions are provided", (): void => {
		const body = mod.create({
			type: 'static',
			position: [1, 2],
			shapes: [{
				type: 'circle',
				position: [0.1, 0.2],
				collisionGroup: 'players',
				collisionMask: 'players, badguys, bullets',
			}],
		}, {players: 1, badguys: 2, bullets: 4});
		expect(body.type).toBe(Body.STATIC);
		expect(body.position[0]).toBe(1);
		expect(body.position[1]).toBe(2);
		expect(body.shapes.length).toBe(1);
		expect(body.shapes[0].type).toBe(Shape.CIRCLE);
	});
});
