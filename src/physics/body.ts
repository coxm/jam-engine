import {Body} from 'p2';

import {create as createShape, ShapeDef} from './shape';


/**
 * Enumerated {@link Body} types.
 */
export const enum BodyType {
	dynamic = 1,
	static = 2,
	kinematic = 4,
}


/**
 * Conversion dict for obtaining {@link Body} types.
 */
export const convert: {
	[key: string]: BodyType;
	[key: number]: BodyType;
} = {
	DYNAMIC: BodyType.dynamic,
	KINEMATIC: BodyType.kinematic,
	STATIC: BodyType.static,

	dynamic: BodyType.dynamic,
	kinematic: BodyType.kinematic,
	static: BodyType.static,

	[Body.DYNAMIC]: BodyType.dynamic,
	[Body.KINEMATIC]: BodyType.kinematic,
	[Body.STATIC]: BodyType.static,
};


export interface BodyDef<Vec2T = AnyVec2> {
	readonly type: number | string;
	readonly mass?: number;
	readonly position?: Vec2T;
	readonly velocity?: Vec2T;
	readonly angle?: number;
	readonly angularVelocity?: number;
	readonly force?: Vec2T;
	readonly angularForce?: number;
	readonly fixedRotation?: boolean;
	readonly shapes?: ReadonlyArray<ShapeDef>;
}


/**
 * Convenience function for creating {@link Body} instances with shapes.
 */
export const create = (
	def: BodyDef,
	collisionGroups?: {[key: string]: number;},
	collisionMasks?: {[key: string]: number;}
)
	: Body =>
{
	const bodyType = convert[def.type!];
	if (typeof bodyType !== 'number') {
		throw new Error(`Invalid body type: '${def.type}'`);
	}
	const body = new Body(Object.assign({}, def as BodyDef<AllVec2>, {
		type: bodyType,
	}));
	if (def.shapes) {
		for (const shapeDef of def.shapes) {
			const shape = createShape(
				shapeDef, collisionGroups, collisionMasks);
			body.addShape(shape, shape.position || [0, 0], shape.angle || 0);
		}
	}
	return body;
};
