import {Manager, Handler} from '../events';


export type MouseEventName = (
	'mousedown' |
	'mouseup'
);


export type MouseHandler = Handler<MouseEventName, MouseEvent>;


export const events: Manager<MouseEventName, MouseHandler> =
	new Manager<MouseEventName, MouseHandler>();


export function listen(
	mgr: Manager<string, MouseEvent>,
	events: string[] = ['mousedown', 'mouseup']
)
	: void
{
	events.forEach((category: any): void => {
		document.addEventListener(category, (ev: MouseEvent): void => {
			mgr.fire(category, ev);
		});
	});
}
