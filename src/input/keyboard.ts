import {Event, Manager as EventManager, Handler} from 'jam/events';

import {KeyCode} from './KeyCode';


/** Interface for the data transmitted with keyboard events. */
export interface KeyEventData {
	originalEvent: KeyboardEvent;
	isDown: boolean;
}


/** Type alias for keyboard events. */
export type KeyEvent = Event<KeyCode, KeyEventData>;


/** Type alias for key event handling function. */
export type KeyHandler = Handler<KeyCode, KeyEventData>;


/** Key down state, by event key code. */
const keysDown = new Int32Array(8);


/**
 * Set the key-down state of a key.
 *
 * @param keyCode the key's numeric code.
 * @param down whether the key should be set to down (true) or up (false).
 * @returns true iff the value changed.
 */
export function setKeyDown(keyCode: KeyCode | number, down: boolean): boolean {
	const index: number = (keyCode / 32) | 0;
	const mask: number = 1 << ((keyCode % 32));
	const old: number = keysDown[index];
	// Bithack: `w = (w & ~m) | (-f & m);` from
	// https://graphics.stanford.edu/~seander/bithacks.html
	return old !== (keysDown[index] = (old & ~mask) | (-down & mask));
}


/** Check if a key is down. */
export function isDown(keyCode: KeyCode | number): boolean {
	return !!(keysDown[(keyCode / 32) | 0] & (1 << (keyCode % 32)));
}


/** The keydown event manager. */
export const keydown =
	new EventManager<KeyCode | number | string | symbol, KeyEventData>();


/** The keyup event manager. */
export const keyup =
	new EventManager<KeyCode | number | string | symbol, KeyEventData>();


/**
 * The function used to listen for key events.
 *
 * Does not fire repeat events: for example if the 'A' key is pressed and held
 * for several seconds, a single keydown event will be fired.
 */
export function onKeyEvent(
	events: EventManager<KeyCode, KeyEventData>,
	condense: (keyCode: KeyCode) => number,
	state: boolean,
	event: KeyboardEvent
)
	: void
{
	const code: number = condense ? condense(event.keyCode) : event.keyCode;
	if (code === +code && setKeyDown(code, state)) {
		events.fire(code, {
			originalEvent: event,
			isDown: state,
		});
	}
}


/**
 * Initialise key event listening for the entire document.
 *
 * @param condense an optional KeyCode condensing function. If provided,
 * key codes for which `condense` returns `undefined` will be ignored. Other
 * key codes will trigger events under the return value.
 *
 * @example
 * initKeyEvents((keyCode) => {
 *     return (keyCode === KeyCode.Enter ? 'Enter' : undefined;
 * });
 * keydown.on('Enter', () => { console.log('Enter string'); });
 * keydown.on(KeyCode.Enter, () => { console.log('Enter KeyCode'); });
 * keydown.on(KeyCode.Space, () => { console.log('Space KeyCode'); });
 * // On 'Enter' keypress: 'string'
 * // On 'Space' keypress, nothing happens.
 */
export function initKeyEvents(
	target?: HTMLElement | Document | undefined | null,
	condense?: (kc: KeyCode) => number
)
	: void
{
	if (!target) {
		target = document;
	}
	target.addEventListener(
		'keydown',
		onKeyEvent.bind(null, keydown, condense, true)
	);
	target.addEventListener(
		'keyup',
		onKeyEvent.bind(null, keyup, condense, false)
	);
}
