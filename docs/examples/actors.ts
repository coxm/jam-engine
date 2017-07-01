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
} from 'jam/actors/Actor';
import {Loader} from 'jam/actors/Loader';


/** Definition for a health component. */
export interface HealthDef extends ComponentDef {
	readonly maxHealth: number;
	readonly initialHealth: number;
}


/** A simple health component. */
export class Health implements Component {
	private readonly maxHealth: number;
	private value: number;

	constructor(def: HealthDef) {
		this.maxHealth = def.maxHealth;
		this.value = def.initialHealth;
	}

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
	private readonly image: string;
	constructor(def: HealthDef) {
		this.image = def.image;
		this.damage = def.damage;
	}

	onAdd(actor: Actor): void {}  // Put on-add logic here if necessary.
	onRemove(actor: Actor): void {}  // Put on-remove logic here if necessary.
}


/** The actor factory. */
export const factory = new Factory<Actor>();


// # Configure component factories.
// This method can be called multiple times, and single component factories can
// be set via the `Factory#setCmpFactory` method.
factory.setCmpFactories({
	health: (def: HealthDef, actorID: symbol, actorDef: ActorDef): Health =>
		new Health(def),
	weapon: (def: WeaponDef, actorID: symbol, actorDef: ActorDef): Weapon =>
		new Weapon(def),
});


// # Simple actor creation.
// Once the factory is configured, it can be used to create actors from
// definitions.
const myActor = factory.create({
	alias: 'MyActor',
	position: [0, 0],
	cmp: [
		{  // The health definition.
			factory: 'health',
			maxHealth: 100,
			initialHealth: 50,
		},
		{  // The weapon definition.
			factory: 'weapon',
			damage: 20,
			image: 'Bullet.png',
		}
	]
});


// # Actor definition merging.
// For more complex games, actors are likely to share traits, such as 'has a
// particlar gun' or 'starts with 100 health'. We can specify dependencies on
// other definitions for convenience.
const hasHealth: PartialActorDef = {
	cmp: [{
		factory: 'health',
		maxHealth: 100,
		initialHealth: 50,
	}],
};
const hasRevolver: PartialActorDef = {
	cmp: [{
		factory: 'weapon',
		damage: 20,
		image: 'Bullet.png',
	}],
};
const hasLaserGun: PartialActorDef = {
	cmp: [{
		factory: 'weapon',
		damage: 40,
		image: 'Laser.png',
	}],
};

/** A bad guy, with health and a revolver. */
const badGuy = factory.create(mergeActorDefs(hasHealth, hasRevolver, {
	alias: 'BadGuy1',
	position: [100, 0],
}));
/** Another bad guy, with health and a laser gun. */
const goodGuy = factory.create(mergeActorDefs(hasHealth, hasLaserGun, {
	alias: 'BadGuy2',
	position: [100, 0],
}));


// # Actor loading.
// The Actor loader is equipped to deal with such recursive definitions,
// allowing us to define an actor schema and create instances of it easily.
export const loader = new Loader({
	baseUrl: 'my-game-assets/actors',
});

// Load the 'BadGuy1' definition.
loader.actorDef('BadGuy1').then(def => factory.create(def));

// Load and merge several partial definitions (complicated method).
Promise.all([
	loader.json<ActorDef>('HasHealth'),
	loader.json<ActorDef>('HasRevolver')
]).then((defs: PartialActorDef[]): void => {
	factory.create(mergeActorDefs(defs));
});

// Load and merge several partial definitions (simple method).
const badGuySchema = {
	depends: ['HasHealth', 'HasRevolver'],
};
loader
	.actorDef(badGuySchema)
	.then(def => factory.create(def));
