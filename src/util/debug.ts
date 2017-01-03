/** Expose values on the global context. */
export function expose(values: any): void {
	for (let key in values) {
		(<any> window)[key] = values[key];
	}
}
