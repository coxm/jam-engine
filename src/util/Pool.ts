export interface PoolOptions<T> {
	readonly create: () => T;
	readonly reset: (t: T) => T | void;
}


export class Pool<T> {
	private readonly list: T[] = [];
	private readonly create: () => T;
	private readonly reset: (t: T) => T | void;

	constructor(options: PoolOptions<T>) {
		this.create = options.create;
		this.reset = options.reset;
	}

	get(): T {
		return this.list.shift() || this.create();
	}

	get size(): number {
		return this.list.length;
	}

	set size(val: number) {
		const len = this.list.length
		if (val < len) {
			this.list.length = val;
		}
		else if (val > len) {
			for (let i = val; i < len; ++i) {
				this.list.push(this.create());
			}
		}
	}

	reclaim(t: T): void {
		t = this.reset(t) || t;
		this.list.push(t);
	}
}
