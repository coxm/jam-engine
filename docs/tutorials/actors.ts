/**
 * @file docs/examples/actors.ts
 *
 * Here we demonstrate a simple configuration for Jam's ECS.
 */
import {Factory} from 'jam/actors/Factory';
import {
	Actor,
	ActorDef,
	Component,
	ComponentDef,
	PartialActorDef,
	mergeActorDefs,
} from 'jam/actors/Actor';
import {Loader} from 'jam/actors/Loader';


/** Definition for a health component. */
export interface HealthDef extends ComponentDef {
	readonly maxHealth: number;
	readonly initialHealth: number;
}


/** A simple health component. */
export class Health implements Component {
	readonly maxHealth: number;
	private value: number;

	constructor(def: HealthDef) {
		this.maxHealth = def.maxHealth;
		this.value = def.initialHealth;
	}

	get key(): string { return 'health'; }

	onAdd(actor: Actor): void {}  // Put on-add logic here if necessary.
	onRemove(actor: Actor): void {}  // Put on-remove logic here if necessary.
	onHit(damage: number): void {
		this.value -= damage;
		if (this.value < 0) {
			// Do something, e.g. fire an `'ActorDead'` event.
		}
	}
}


/** Definition for a weapon. */
export interface WeaponDef extends ComponentDef {
	readonly damage: number;
	readonly image: string;
}


/** A simple weapon component. */
export class Weapon implements Component {
	readonly damage: number;
	readonly image: string;

	get key(): string { return 'weapon'; }

	constructor(def: WeaponDef) {
		this.image = def.image;
		this.damage = def.damage;
	}

	onAdd(actor: Actor): void {}  // Put on-add logic here if necessary.
	onRemove(actor: Actor): void {}  // Put on-remove logic here if necessary.
}


/** The actor factory. */
export const factory = new Factory<Actor>();


// # Configure component factories.
const createHealthComponent = (
	def: HealthDef,
	actorID: number,
	actorDef: ActorDef,
): Health => new Health(def as HealthDef);
factory.setCmpFactory('health', createHealthComponent);

const createWeaponComponent = (
	def: WeaponDef,
	actorID: number,
	actorDef: ActorDef,
): Weapon => new Weapon(def as WeaponDef);
factory.setCmpFactory('weapon', createWeaponComponent);


// # Simple actor creation.
// Once the factory is configured, it can be used to create actors from
// definitions.
export function createActorSimple(): Actor {
	const healthDef: HealthDef = {
		factory: 'health',
		maxHealth: 100,
		initialHealth: 50,
	};
	const weaponDef: WeaponDef = {
		factory: 'weapon',
		damage: 20,
		image: 'Bullet.png',
	};
	const actor = factory.actor({
		alias: 'MyActor',
		position: [0, 0],
		cmp: [healthDef, weaponDef],
	});
	console.assert((actor.cmp.health as Health).maxHealth === 100);
	console.assert((actor.cmp.weapon as Weapon).damage === 20);
	console.assert((actor.cmp.weapon as Weapon).image === 'Bullet.png');
	return actor;
}


// # Actor definition merging.
// For more complex games, actors are likely to share traits, such as 'has a
// particlar gun' or 'starts with 100 health'. We can specify dependencies on
// other definitions for convenience.
const defs: {[filepath: string]: PartialActorDef;} = {
	hasHealth: {
		"cmp": [{
			"factory": "health",
			"maxHealth": 100,
			"initialHealth": 50
		} as HealthDef],
	},
	hasWeapon: {
		"cmp": [{
			"factory": "weapon",
			"damage": 20,
			"image": "Bullet.png"
		} as WeaponDef],
	},
	badGuy: {
		"alias": "BadGuy1",
		"position": [100, 0],
		"depends": ["HasHealth", "HasRevolver"],
	},
};


// We can then explicitly merge the definitions together.
export function createBadGuys(): Actor[] {
	return [
		// A bad guy, with health and a revolver.
		factory.actor(mergeActorDefs([defs.hasHealth, defs.hasRevolver], {
			alias: 'BadGuy1',
			position: [100, 0],
		})),
		// Another bad guy, with health and a laser gun.
		factory.actor(mergeActorDefs([defs.hasHealth, defs.hasLaserGun], {
			alias: 'BadGuy2',
			position: [100, 0],
		})),
	];
}


// Or we can use a loader to merge definitions automatically.
export async function createBadGuys2(): Promise<Actor[]> {
	const loader = new Loader(
		(name: string) => defs[name]! // Could also return a promise.
	);

	// Load the 'BadGuy1' definition and construct the actor.
	const badGuy1 = await loader
		.actorDef('BadGuy')
		.then(def => factory.actor(def));
	console.assert(Object.keys(badGuy1.cmp).length === 2);

	// Alternatively, we can pass the root definition as an object.
	const badGuy2 = await loader
		.fromPartialDef({
			"alias": "BadGuy2",
			"position": [100, 0],
			"depends": ["HasHealth", "HasRevolver"],
		})
		.then(def => factory.actor(def));
	console.assert(Object.keys(badGuy2.cmp).length === 2);
	return [badGuy1, badGuy2];
}
