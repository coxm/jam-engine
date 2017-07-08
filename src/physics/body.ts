import {create as createShape, ShapeDef} from './shape';


/**
 * Enumerated {@link p2.Body} types.
 */
export const enum BodyType {
	dynamic = 1,
	static = 2,
	kinematic = 4,
}


/**
 * Conversion dict for obtaining {@link p2.Body} types.
 */
export const convert: {
	[key: string]: number;
	[key: number]: number;
} = {
	DYNAMIC: BodyType.dynamic,
	KINEMATIC: BodyType.kinematic,
	STATIC: BodyType.static,

	dynamic: BodyType.dynamic,
	kinematic: BodyType.kinematic,
	static: BodyType.static,

	[p2.Body.DYNAMIC]: BodyType.dynamic,
	[p2.Body.KINEMATIC]: BodyType.kinematic,
	[p2.Body.STATIC]: BodyType.static,
};


export interface BodyDef {
	readonly type: number | string;
	readonly mass?: number;
	readonly position?: AnyVec2;
	readonly velocity?: AnyVec2;
	readonly angle?: number;
	readonly angularVelocity?: number;
	readonly force?: AnyVec2;
	readonly angularForce?: number;
	readonly fixedRotation?: boolean;
	readonly shapes?: (p2.ShapeOptions | ShapeDef)[];
}


/**
 * Convenience function for creating {@link p2.Body} instances with shapes.
 */
export const create = (
	def: BodyDef,
	collisionGroups?: {[key: string]: number;},
	collisionMasks?: {[key: string]: number;}
)
	: p2.Body =>
{
	const bodyType = convert[def.type!];
	if (typeof bodyType !== 'number') {
		throw new Error(`Invalid body type: '${def.type}'`);
	}
	const body = new p2.Body(Object.assign({}, def, {
		type: bodyType,
	}));
	if (def.shapes) {
		for (let shapeDef of def.shapes) {
			const shape = createShape(
				shapeDef, collisionGroups, collisionMasks);
			body.addShape(shape, shape.position || [0, 0], shape.angle || 0);
		}
	}
	return body;
};
