import {Event, Manager as EventManager, Handler} from 'jam/events/Manager';


/** Interface for the data transmitted with keyboard events. */
export interface KeyEventData {
	originalEvent: KeyboardEvent;
	isDown: boolean;
}


/** Type alias for keyboard events. */
export type KeyEvent = Event<string, KeyEventData>;


/** Type alias for key event handling function. */
export type KeyHandler = Handler<string, KeyEventData>;


/** Key down state, by event key code. */
const keysDown: {[key: string]: boolean;} = {};


/**
 * Set the key-down state of a key.
 *
 * @param key the key being pressed.
 * @param down whether the key should be set to down (true) or up (false).
 * @returns true iff the value changed.
 */
export function setKeyDown(key: number | string, down: boolean): boolean {
	const wasDown = !!keysDown[key];
	keysDown[key] = down;
	return wasDown !== down;
}


/** Check if a key is down. */
export function isDown(key: string | number): boolean {
	return keysDown[key];
}


/** The keydown event manager. */
export const keydown = new EventManager<string | number, KeyEventData>();


/** The keyup event manager. */
export const keyup = new EventManager<string | number, KeyEventData>();


/**
 * A function which converts a keyboard event into a number/string identifier.
 *
 * Should return `undefined` when the event should be ignored.
 */
export type EventCondenser =
	(ev: KeyboardEvent) => string | number | undefined;


/**
 * Default EventCondenser function.
 *
 * @note requires browser support for `KeybaordEvent#key`.
 */
export const defaultCondenser: EventCondenser =
	(ev: KeyboardEvent): string => ev.key;


/** An EventCondenser function returning event key codes. */
export const keyCodeCondenser: EventCondenser =
	(ev: KeyboardEvent): number => ev.keyCode;


/**
 * The function used to listen for key events.
 *
 * Does not fire repeat events: for example if the 'A' key is pressed and held
 * for several seconds, a single keydown event will be fired.
 */
export function onKeyEvent(
	events: EventManager<string | number, KeyEventData>,
	condense: EventCondenser,
	state: boolean,
	event: KeyboardEvent
)
	: void
{
	const code = condense(event);
	if (code !== undefined && setKeyDown(code, state)) {
		events.fire(code, {
			originalEvent: event,
			isDown: state,
		});
	}
}


const allKeyEvents = new WeakMap<HTMLElement | Document, {
	up: EventListener;
	down: EventListener;
}>();


/**
 * Initialise key event listening for the entire document.
 *
 * @param condense an optional KeyCode condensing function. If provided,
 * key events for which `condense` returns `undefined` will be ignored. Other
 * key events will be forwarded by the manager under the key returned by
 * `condense`.
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
	condense: EventCondenser = defaultCondenser
)
	: void
{
	if (!target) {
		target = document;
	}
	const down = onKeyEvent.bind(null, keydown, condense, true);
	const up = onKeyEvent.bind(null, keyup, condense, false);
	target.addEventListener('keydown', down as EventListener);
	target.addEventListener('keyup', up as EventListener);
	allKeyEvents.set(target, {
		down: down as EventListener,
		up: up as EventListener,
	});
}


/**
 * Remove key event handlers set by {@link initKeyEvents}.
 */
export function stopKeyEvents(
	target?: HTMLElement | Document | undefined | null
)
	: void
{
	if (!target) {
		target = document;
	}
	const handlers = allKeyEvents.get(target);
	if (handlers) {
		target.removeEventListener('keydown', handlers.down);
		target.removeEventListener('keyup', handlers.up);
		allKeyEvents.delete(target);
	}
}
