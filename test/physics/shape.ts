import * as p2 from 'p2';

import * as mod from 'jam/physics/shape';


describe("ShapeType enum", (): void => {
	it("is defined correctly", (): void => {
		expect(mod.ShapeType.circle).toBe(p2.Shape.CIRCLE);
		expect(mod.ShapeType.particle).toBe(p2.Shape.PARTICLE);
		expect(mod.ShapeType.plane).toBe(p2.Shape.PLANE);
		expect(mod.ShapeType.convex).toBe(p2.Shape.CONVEX);
		expect(mod.ShapeType.line).toBe(p2.Shape.LINE);
		expect(mod.ShapeType.box).toBe(p2.Shape.BOX);
		expect(mod.ShapeType.capsule).toBe(p2.Shape.CAPSULE);
		expect(mod.ShapeType.heightfield).toBe(p2.Shape.HEIGHTFIELD);
	});
});


describe("convert dict", (): void => {
	it("types are configured correctly", (): void => {
		const checks = <[string, string, number][]> [
			['circle', 'CIRCLE', p2.Shape.CIRCLE],
			['particle', 'PARTICLE', p2.Shape.PARTICLE],
			['plane', 'PLANE', p2.Shape.PLANE],
			['convex', 'CONVEX', p2.Shape.CONVEX],
			['line', 'LINE', p2.Shape.LINE],
			['box', 'BOX', p2.Shape.BOX],
			['capsule', 'CAPSULE', p2.Shape.CAPSULE],
			['heightfield', 'HEIGHTFIELD', p2.Shape.HEIGHTFIELD]
		];
		for (let [lower, upper, type] of checks) {
			expect(mod.convert[lower].type).toBe(type, lower);
			expect(mod.convert[upper].type).toBe(type, lower);
			expect(mod.convert[type].type).toBe(type, lower);
		}
	});

	it("classes are configured correctly", (): void => {
		const checks = <[string, string, number, typeof p2.Shape][]> [
			['circle', 'CIRCLE', p2.Shape.CIRCLE, p2.Circle],
			['particle', 'PARTICLE', p2.Shape.PARTICLE, p2.Particle],
			['plane', 'PLANE', p2.Shape.PLANE, p2.Plane],
			['convex', 'CONVEX', p2.Shape.CONVEX, p2.Convex],
			['line', 'LINE', p2.Shape.LINE, p2.Line],
			['box', 'BOX', p2.Shape.BOX, p2.Box],
			['capsule', 'CAPSULE', p2.Shape.CAPSULE, p2.Capsule],
			['heightfield', 'HEIGHTFIELD', p2.Shape.HEIGHTFIELD,
				p2.Heightfield],
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
		expect(shape.constructor).toBe(p2.Circle);
		expect(shape.type).toBe(p2.Shape.CIRCLE);
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
		expect(shape.constructor).toBe(p2.Circle);
		expect(shape.type).toBe(p2.Shape.CIRCLE);
		expect(shape.position[0]).toBeCloseTo(0.1);
		expect(shape.position[1]).toBeCloseTo(0.2);
		expect(shape.collisionGroup).toBe(collisionGroups.players);
		expect(shape.collisionMask).toBe(7);
	});
});
