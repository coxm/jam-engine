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

	/** The ID for the keydown events batch. */
	private keydownID: symbol;

	/** The ID for the keyup events batch. */
	private keyupID: symbol;

	abstract getDriver(actor: Actor): Driver;

	getKeyDownContext(driver: Driver): any {
		return driver;
	}

	getKeyUpContext(driver: Driver): any {
		return driver;
	}

	getKeyDownHandlers(driver: Driver): [KeyAction, () => void][] {
		return [
			[KeyAction.up, driver.up.bind(driver)],
			[KeyAction.down, driver.down.bind(driver)],
			[KeyAction.left, driver.left.bind(driver)],
			[KeyAction.right, driver.right.bind(driver)]
		];
	}

	getKeyUpHandlers(driver: Driver): [KeyAction, () => void][] {
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

		this.keydownID = keydown.batch(
			this.getKeyDownHandlers(driver),
			{context: this.getKeyDownContext(driver)}
		);
		this.keyupID = keyup.batch(
			this.getKeyUpHandlers(driver),
			{context: this.getKeyUpContext(driver)}
		);
	}

	onRemove(actor: Actor): void {
		keydown.unbatch(this.keydownID);
		keyup.unbatch(this.keyupID);
	}
}
