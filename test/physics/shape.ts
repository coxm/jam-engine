import {
	Shape, Circle, Particle, Plane, Convex, Line, Box, Capsule, Heightfield,
} from 'p2';

import * as mod from 'jam/physics/shape';


describe("ShapeType enum", (): void => {
	it("is defined correctly", (): void => {
		expect(mod.ShapeType.circle).toBe(Shape.CIRCLE);
		expect(mod.ShapeType.particle).toBe(Shape.PARTICLE);
		expect(mod.ShapeType.plane).toBe(Shape.PLANE);
		expect(mod.ShapeType.convex).toBe(Shape.CONVEX);
		expect(mod.ShapeType.line).toBe(Shape.LINE);
		expect(mod.ShapeType.box).toBe(Shape.BOX);
		expect(mod.ShapeType.capsule).toBe(Shape.CAPSULE);
		expect(mod.ShapeType.heightfield).toBe(Shape.HEIGHTFIELD);
	});
});


describe("convert dict", (): void => {
	it("types are configured correctly", (): void => {
		const checks = <[string, string, number][]> [
			['circle', 'CIRCLE', Shape.CIRCLE],
			['particle', 'PARTICLE', Shape.PARTICLE],
			['plane', 'PLANE', Shape.PLANE],
			['convex', 'CONVEX', Shape.CONVEX],
			['line', 'LINE', Shape.LINE],
			['box', 'BOX', Shape.BOX],
			['capsule', 'CAPSULE', Shape.CAPSULE],
			['heightfield', 'HEIGHTFIELD', Shape.HEIGHTFIELD]
		];
		for (let [lower, upper, type] of checks) {
			expect(mod.convert[lower].type).toBe(type, lower);
			expect(mod.convert[upper].type).toBe(type, lower);
			expect(mod.convert[type].type).toBe(type, lower);
		}
	});

	it("classes are configured correctly", (): void => {
		const checks = <[string, string, number, typeof Shape][]> [
			['circle', 'CIRCLE', Shape.CIRCLE, Circle],
			['particle', 'PARTICLE', Shape.PARTICLE, Particle],
			['plane', 'PLANE', Shape.PLANE, Plane],
			['convex', 'CONVEX', Shape.CONVEX, Convex],
			['line', 'LINE', Shape.LINE, Line],
			['box', 'BOX', Shape.BOX, Box],
			['capsule', 'CAPSULE', Shape.CAPSULE, Capsule],
			['heightfield', 'HEIGHTFIELD', Shape.HEIGHTFIELD,
				Heightfield],
		];
		for (let [lower, upper, type, cls] of checks) {
			expect(mod.convert[lower].cls).toBe(cls, lower);
			expect(mod.convert[upper].cls).toBe(cls, lower);
			expect(mod.convert[type].cls).toBe(cls, lower);
		}
	});
});


describe("parseCollisionMask parses", () => {
	let collisionGroups: {[key: string]: number;};

	beforeEach((): void => {
		collisionGroups = {
			players: 1,
			badguys: 2,
			bullets: 4,
		};
	});

	for (let str of [
		'players,badguys,bullets',
		'players , badguys,bullets',
		'players, badguys, bullets',
		'players|badguys|bullets',
		'players | badguys|bullets',
		'players| badguys | bullets',
		'players|badguys,bullets',
		'players , badguys|bullets',
		'players, badguys | bullets',
	]) {
		it(`'${str}' as \`players | badguys | bullets\``, (): void => {
			expect(mod.parseCollisionMask(str, collisionGroups)).toBe(7);
		});
	}

	for (let str of [
		'bullets, people',
		'bullets,people',
		'bullets|people',
		'bullets |people',
		'bullets , people'
	]) {
		it(`'${str}' as \`players | badguys | bullets\``, (): void => {
			expect(mod.parseCollisionMask(str, collisionGroups, {
				people: collisionGroups.players | collisionGroups.badguys,
			})).toBe(7);
		});
	}
});


describe("create function", () => {
	let collisionGroups: {[key: string]: number;};
	let def: mod.ShapeDef;

	beforeEach((): void => {
		collisionGroups = {
			players: 1,
			badguys: 2,
			bullets: 4,
		};

		def = {
			type: 'circle',
			position: [0.1, 0.2],
			collisionGroup: 'players',
			collisionMask: 'players, badguys, bullets',
		};
	});

	it("uses the groups for masks if no custom masks are provided", () => {
		const shape = mod.create(def, collisionGroups);
		expect(shape.constructor).toBe(Circle);
		expect(shape.type).toBe(Shape.CIRCLE);
		expect(shape.position[0]).toBeCloseTo(0.1);
		expect(shape.position[1]).toBeCloseTo(0.2);
		expect(shape.collisionGroup).toBe(collisionGroups.players);
		expect(shape.collisionMask).toBe(7);
	});
	it("uses custom masks if provided", () => {
		const collisionMasks = {
			people: collisionGroups.players | collisionGroups.badguys,
		};
		(def as any).collisionMask = 'people, bullets';
		const shape = mod.create(def, collisionGroups, collisionMasks);
		expect(shape.constructor).toBe(Circle);
		expect(shape.type).toBe(Shape.CIRCLE);
		expect(shape.position[0]).toBeCloseTo(0.1);
		expect(shape.position[1]).toBeCloseTo(0.2);
		expect(shape.collisionGroup).toBe(collisionGroups.players);
		expect(shape.collisionMask).toBe(7);
	});
});
