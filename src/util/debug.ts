/** Expose values on the global context. */
export function expose(values: any): void {
	for (let key in values) {
		(<any> window)[key] = values[key];
	}
}


const logged: {[name: string]: boolean;} = {};
export function logOnce(name: string, ...args: any[]): void {
	if (logged[name]) {
		return;
	}
	logged[name] = true;
	console.log.apply(console, arguments);
}
