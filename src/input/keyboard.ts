import {Manager, Handler} from '../events';


export type KeyboardEventName = (
	'keydown' |
	'keyup' |
	'keypress'
);


export type KeyHandler = Handler<KeyboardEventName, KeyboardEvent>;


export const events: Manager<KeyboardEventName, KeyHandler> =
	new Manager<KeyboardEventName, KeyHandler>();


export function listen(
	mgr: Manager<string, KeyboardEvent>,
	events: string[] = ['keydown', 'keyup', 'keypress']
)
	: void
{
	events.forEach((category: any): void => {
		document.addEventListener(category, (ev: KeyboardEvent): void => {
			mgr.fire(category, ev);
		});
	});
}
