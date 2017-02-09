export const DEG_TO_RAD = Math.PI / 180;
export const RAD_TO_DEG = 180 / Math.PI;


export interface DegreesObject {
	rotation: number;
}


export type WithRadians<T> = T & {radians: number;};


const radiansGetSet = {
	get(this: WithRadians<DegreesObject>): number {
		return this.radians * RAD_TO_DEG;
	},
	set(this: WithRadians<DegreesObject>, val: number) {
		this.radians = val * DEG_TO_RAD;
	}
};


export function setRadians<T extends DegreesObject>(ob: T): WithRadians<T> {
	if ((<WithRadians<T>> ob).radians !== undefined) {
		return <WithRadians<T>> ob;
	}

	(<WithRadians<T>> ob).radians = DEG_TO_RAD * ob.rotation;
	delete ob.rotation;
	Object.defineProperty(ob, 'rotation', radiansGetSet);
	return <WithRadians<T>> ob;
}


export function angleOf(ob: DegreesObject): number {
	return setRadians(ob).radians;
}


export interface TileObject {
	id: number;
	type: string;
	name: string;
	x: number;
	y: number;
	rotation: number;
	width: number;
	height: number;
	properties?: any;
	gid: number;
}


export function centreOf(out: AnyVec2, ob: TileObject): AnyVec2 {
	const angle: number = angleOf(ob);
	const c: number = Math.cos(angle);
	const s: number = Math.sin(angle);
	const w: number = ob.width;
	const h: number = ob.height;
	out[0] = ob.x + 0.5 * (w * c + h * s);
	out[1] = ob.y + 0.5 * (w * s - h * c);
	return out;
}
