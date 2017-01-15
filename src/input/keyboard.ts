import {Event, Manager as EventManager} from '../events';


/** Interface for the data transmitted with keyboard events. */
export interface KeyEventData {
	originalEvent: KeyboardEvent;
	isDown: boolean;
}


/** Type alias for keyboard events. */
export type KeyEvent = Event<symbol, KeyEventData>;


/**
 * Actions which keyboard input will be translated into.
 *
 * For example, hitting 'W' may be interpreted as an 'up' action.
 */
export const actions: {
	[name: string]: symbol;
	up: symbol;
	down: symbol;
	left: symbol;
	right: symbol;
	pause: symbol;
	escape: symbol;
} = {
	up: Symbol('up'),
	down: Symbol('down'),
	left: Symbol('left'),
	right: Symbol('right'),
	pause: Symbol('pause'),
	escape: Symbol('escape'),
};


/**
 * Default key code symbols.
 *
 * This dict can be altered if required, or if preferred the key translator can
 * be changed instead, using {@link setKeyTranslator}.
 */
export const defaultKeyCodeSymbols: { [code: number]: symbol; } = {
	19: actions.pause, // Pause/Break.
	27: actions.escape, // Escape.

	37: actions.left,  // Left.
	38: actions.up,    // Up.
	39: actions.right, // Right.
	40: actions.down,  // Down.

	65: actions.left,  // A.
	68: actions.right, // D.
	83: actions.down,  // S.
	87: actions.up,    // W.

	72: actions.left,  // H.
	74: actions.down,  // J.
	75: actions.up,    // K.
	76: actions.right, // L.
};


/**
 * The function which translates keys into actions.
 *
 * Can be overwritten by {@link setKeyTranslator}.
 */
let keyTranslator: (code: number) => symbol =
	(code: number): symbol => defaultKeyCodeSymbols[code];


/** Set the function which translates key codes into action symbols. */
export function setKeyTranslator(fn: (code: number) => symbol): void {
	keyTranslator = fn;
}


/** Key down state, by event key code. */
const keyIsDown: { [keyCode: number]: boolean; } = {};


/** The keydown event manager. */
export const keydown: EventManager<symbol, KeyEventData> =
	new EventManager<symbol, KeyEventData>();


/** The keyup event manager. */
export const keyup: EventManager<symbol, KeyEventData> =
	new EventManager<symbol, KeyEventData>();


/**
 * The function used to listen for key events.
 *
 * Does not fire repeat events: for example if the 'A' key is pressed and held
 * for several seconds, a single keydown event will be fired.
 */
export function onKeyEvent(
	events: EventManager<symbol, KeyEventData>,
	state: boolean,
	event: KeyboardEvent
)
	: void
{
	const sym: symbol = keyTranslator(event.keyCode);
	if ((sym !== undefined) && (keyIsDown[event.keyCode] !== state)) {
		keyIsDown[event.keyCode] = state;
		events.fire(sym, {
			originalEvent: event,
			isDown: state
		});
	}
}


document.addEventListener('keydown', onKeyEvent.bind(null, keydown, true));
document.addEventListener('keyup', onKeyEvent.bind(null, keyup, false));
