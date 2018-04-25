import {
	Shape, Circle, Particle, Plane, Convex, Line, Box, Capsule, Heightfield,
	ShapeOptions, BoxOptions,
} from 'p2';


/**
 * Enumerated {@link Shape} types.
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


export interface P2BoxOptions extends BoxOptions {
	collisionGroup?: number;
	collisionResponse?: boolean;
	collisionMask?: number;
	sensor?: boolean;
}


export type ShapeConstructor = (
	{new(options: ShapeOptions): Shape;} |
	{new(options: P2BoxOptions): Box;}
);


export interface ShapeConverter {
	type: ShapeType;
	cls: ShapeConstructor;
}


/**
 * Conversion dict for obtaining {@link Shape} types.
 */
export const convert: {
	[key: string]: ShapeConverter;
	[key: number]: ShapeConverter;
} = {
	CIRCLE: {type: ShapeType.circle, cls: Circle},
	PARTICLE: {type: ShapeType.particle, cls: Particle},
	PLANE: {type: ShapeType.plane, cls: Plane},
	CONVEX: {type: ShapeType.convex, cls: Convex},
	LINE: {type: ShapeType.line, cls: Line},
	BOX: {type: ShapeType.box, cls: Box},
	CAPSULE: {type: ShapeType.capsule, cls: Capsule},
	HEIGHTFIELD: {type: ShapeType.heightfield, cls: Heightfield},
}
for (const key in convert) {
	convert[key.toLowerCase()] = convert[(Shape as any)[key]] =
		convert[key];
}


/**
 * Generalised {@link ShapeOptions} which allows string types, groups & masks.
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


/** Any definition valid for shape creation. */
export type AnyShapeDef = (
	ShapeDef |
	(ShapeOptions & {type: number|string;}) |
	(P2BoxOptions & {type: 'box'|ShapeType.box;})
);


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
 * Convenience function for creating {@link Shape} instances
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
	def: AnyShapeDef,
	collisionGroups?: {[key: string]: number;},
	collisionMasks?: {[key: string]: number;},
)
	: Shape =>
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
	const ctor = convert[def.type!];
	if (!ctor) {
		throw new Error(`Invalid type: ${def.type}`);
	}
	return new (ctor as any)!(def);
};
