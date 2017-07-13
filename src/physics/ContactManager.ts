import {pair} from 'jam/util/pairing';
import {cancellable, CancellableIterator} from 'jam/util/iterate';


export type P2ContactEvent = (
	p2.BeginContactEvent |
	p2.EndContactEvent
);


export interface ShapeContactInfo {
	readonly shape: p2.Shape;
	readonly body: p2.Body;
}


export interface NormalContactEvent {
	readonly begin: boolean;
	readonly a: ShapeContactInfo;
	readonly b: ShapeContactInfo;
}


export interface SensorContactEvent {
	readonly begin: boolean;
	readonly sensor: ShapeContactInfo;
	readonly normal: ShapeContactInfo;
}


export interface ContactManagerOptions {
	onNormalContact(ev: NormalContactEvent): void;
	onSensorContact(ev: SensorContactEvent): void;
}


type EventIterator = CancellableIterator<[string | number, P2ContactEvent]>;


export class ContactManager {
	private begin = new Map<string | number, P2ContactEvent>();
	private end = new Map<string | number, P2ContactEvent>();
	private known = new Map<string | number, P2ContactEvent>();

	private beginIter: EventIterator | null = null;
	private endIter: EventIterator | null = null;

	private world: p2.World | null = null;

	constructor(public readonly options: ContactManagerOptions) {
	}

	get isInstalled(): boolean {
		return !!this.world;
	}

	install(world: p2.World): void {
		if (this.world) {
			throw new Error(
				"ContactManager can only be installed to one world at a time");
		}
		this.world = world;
		const handlers = this.handlers();
		for (const key in handlers) {
			world.on(key, handlers[key], this);
		}
	}

	uninstall(): void {
		if (this.beginIter) {
			this.beginIter.cancel();
		}
		if (this.endIter) {
			this.endIter.cancel();
		}
		if (this.world) {
			const handlers = this.handlers();
			for (const key in handlers) {
				this.world.off(key, handlers[key]);
			}
		}
		this.world = null;
	}

	onPostStep(): void {
		const iBegin = this.beginIter = cancellable(this.begin.entries());
		const iEnd = this.endIter = cancellable(this.end.entries());
		for (const [key, ev] of iBegin) {
			this.fireEvent(ev);
			this.known.set(key, ev);
		}
		for (const [key, ev] of iEnd) {
			this.fireEvent(ev);
			this.known.delete(key);
		}

		this.begin.clear();
		this.end.clear();
	}

	protected handlers(): {[event: string]: Function;} {
		return {
			beginContact: this.onContactBegin,
			endContact: this.onContactEnd,
			postStep: this.onPostStep,
		};
	}

	protected onContactBegin(ev: p2.BeginContactEvent): void {
		const key = pair(ev.shapeA.id, ev.shapeB.id);
		if (!this.known.has(key)) {
			this.begin.set(key, ev);
		}
	}

	protected onContactEnd(ev: p2.EndContactEvent): void {
		const key = pair(ev.shapeA.id, ev.shapeB.id);
		this.begin.delete(key);
		this.end.set(key, ev);
	}

	protected fireEvent(ev: P2ContactEvent): void {
		if (ev.shapeA.sensor && ev.shapeB.sensor) {
			return;
		}

		const begin: boolean = ev.type[0] === 'b';
		let a = {shape: ev.shapeA, body: ev.bodyA};
		let b = {shape: ev.shapeB, body: ev.bodyB};

		if (a.shape.sensor) {
			this.options.onSensorContact({begin, sensor: a, normal: b});
			return;
		}
		else if (b.shape.sensor) {
			this.options.onSensorContact({begin, normal: a, sensor: b});
		}
		else {
			this.options.onNormalContact({begin, a, b});
		}
	}
}
