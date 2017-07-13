/**
 * Enumerated {@link p2.Shape} types.
 */
export const enum ShapeType {
	circle = 1,
	particle = 2,
	plane = 4,
	convex = 8,
	line = 16,
	box = 32,
	capsule = 64,
	heightfield = 128,
}


/**
 * Conversion dict for obtaining {@link p2.Shape} types.
 */
export const convert: {
	[key: string]: {type: number; cls: typeof p2.Shape;};
	[key: number]: {type: number; cls: typeof p2.Shape;};
} = {
	CIRCLE: {type: ShapeType.circle, cls: p2.Circle},
	PARTICLE: {type: ShapeType.particle, cls: p2.Particle},
	PLANE: {type: ShapeType.plane, cls: p2.Plane},
	CONVEX: {type: ShapeType.convex, cls: p2.Convex},
	LINE: {type: ShapeType.line, cls: p2.Line},
	BOX: {type: ShapeType.box, cls: p2.Box},
	CAPSULE: {type: ShapeType.capsule, cls: p2.Capsule},
	HEIGHTFIELD: {type: ShapeType.heightfield, cls: p2.Heightfield},
}
for (const key in convert) {
	convert[key.toLowerCase()] = convert[(p2.Shape as any)[key]] =
		convert[key];
}


/**
 * Generalised {@link p2.ShapeDef} which allows string types, groups and masks.
 */
export interface ShapeDef {
	readonly type: number | string;
	readonly position?: number[];
	readonly angle?: number;
	readonly collisionGroup?: number | string;
	readonly collisionMask?: number | string;
	readonly collisionResponse?: boolean;
	readonly sensor?: boolean;
}


/**
 * Parse collision mask strings.
 *
 * @param groups the collision groups available.
 * @param input the collision mask, as a comma-, space- and/or '|'-separated
 * list.
 *
 * @example
 * parseCollisionMask({
 *     players: 1,
 *     badguys: 2,
 *     bullets: 4,
 * }, 'players, badguys, bullets'); // Output: 7
 */
export const parseCollisionMask = (
	input: string,
	groups: {[key: string]: number;},
	masks?: {[key: string]: number;}
)
	: number =>
{
	return input.split(/[\s\|,;]+/).reduce(
		(mask: number, group: string): number => {
			let val: number | undefined;
			if (typeof group === 'number') {
				val = group;
			}
			else if (group === '*') {
				val = -1;
			}
			else if (groups[group] !== undefined) {
				val = groups[group];
			}
			else if (masks) {
				val = masks[group];
			}
			if (typeof val !== 'number') {
				throw new Error(`Invalid group '${group}' from '${input}'`);
			}
			return mask | val;
		},
		0
	);
};


/**
 * Convenience function for creating {@link p2.Shape} instances
 *
 * Allows definitions to refer to shape types, collision groups and collision
 * masks by name as well as by their enumeration.
 *
 * @param def the shape options.
 * @param collisionGroups a lookup dict for collision group values.
 * @param collisionMasks a lookup dict for collision mask values.
 *
 * @example
 * const collisionGroups = {
 *     players = 1,
 *     badguys = 2,
 * };
 * const shape = create({
 *     type: 'dynamic',
 *     collisionGroup: 'players',
 *     collisionMask: 'players, badguys',
 *     // ...
 * });
 *
 * @example
 * const collisionGroups = {
 *     players = 1,
 *     badguys = 2,
 *     bullets = 4,
 *     buildings = 8,
 * };
 * const collisionMasks = Object.assign({
 *     actors: collisionGroups.
 * }, collisionGroups);
 * const shape = create({
 *     type: 'dynamic',
 *     collisionGroup: 'players',
 *     collisionMask: 'actors, buildings',
 *     // ...
 * });
 */
export const create = (
	def: ShapeDef | p2.ShapeOptions,
	collisionGroups?: {[key: string]: number;},
	collisionMasks?: {[key: string]: number;},
)
	: p2.Shape =>
{
	if (collisionGroups) {
		def = Object.assign({}, def);
		if (typeof def.collisionGroup === 'string') {
			(def as any).collisionGroup = collisionGroups[def.collisionGroup];
		}
		if (typeof def.collisionMask === 'string') {
			(def as any).collisionMask = parseCollisionMask(
				def.collisionMask,
				collisionGroups,
				collisionMasks
			);
		}
	}
	return new convert[def.type!].cls(def as p2.ShapeOptions);
};
