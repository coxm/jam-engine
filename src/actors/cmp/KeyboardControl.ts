import {keydown, keyup} from 'jam/input/keyboard';
import {KeyAction} from 'jam/input/KeyAction';

import {Actor, ComponentBase} from 'jam/actors/Actor';


export interface Driver {
	up(): void;
	stopUp(): void;
	down(): void;
	stopDown(): void;
	left(): void;
	stopLeft(): void;
	right(): void;
	stopRight(): void;
}


/** A controller component which moves an actor according to keyboard input. */
export abstract class KeyboardControl extends ComponentBase {
	key: string;

	/** The event batching ID. */
	private readonly eventsID: symbol = Symbol('KeyboardControl');

	abstract getDriver(actor: Actor): Driver;

	getKeyDownContext(driver: Driver): any {
		return driver;
	}

	getKeyUpContext(driver: Driver): any {
		return driver;
	}

	getKeyDownHandlers(driver: Driver): [any, () => void][] {
		return [
			[KeyAction.up, driver.up.bind(driver)],
			[KeyAction.down, driver.down.bind(driver)],
			[KeyAction.left, driver.left.bind(driver)],
			[KeyAction.right, driver.right.bind(driver)]
		];
	}

	getKeyUpHandlers(driver: Driver): [any, () => void][] {
		return [
			[KeyAction.up, driver.stopUp.bind(driver)],
			[KeyAction.down, driver.stopDown.bind(driver)],
			[KeyAction.left, driver.stopLeft.bind(driver)],
			[KeyAction.right, driver.stopRight.bind(driver)]
		];
	}

	onAdd(actor: Actor): void {
		const driver = this.getDriver(actor);
		if (!driver) {
			throw new Error("Key input requires a driver");
		}

		if (!keydown.hasBatch(this.eventsID)) {
			keydown.batch(this.getKeyDownHandlers(driver), {
				context: this.getKeyDownContext(driver),
				id: this.eventsID,
			});
		}
		if (!keyup.hasBatch(this.eventsID)) {
			keyup.batch(this.getKeyUpHandlers(driver), {
				context: this.getKeyUpContext(driver),
				id: this.eventsID,
			});
		}
	}

	onRemove(actor: Actor): void {
		keydown.unbatch(this.eventsID);
		keyup.unbatch(this.eventsID);
	}
}
