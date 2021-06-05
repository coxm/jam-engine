export interface LoopFunction<Context> {
	(this: Context, msNow: number, msSinceLast: number): void;
}


export interface LoopOptions<Context = never> {
	readonly fn: LoopFunction<Context>;
	readonly ms: number;
	readonly ctx: Context;
}


export class Loop<Context = never> {
	readonly fn: LoopFunction<Context>;
	readonly ms: number;
	readonly ctx: Context | undefined;

	private intervalID: any = 0;

	constructor(options: LoopOptions<Context>) {
		this.fn = options.fn;
		this.ms = options.ms;
		this.ctx = options.ctx;
	}

	start(): void {
		if (this.intervalID === 0) {
			let prev: number = Date.now();
			this.intervalID = setInterval((): void => {
				const now: number = Date.now();
				this.fn.call(this.ctx as Context, now, now - prev);
				prev = now;
			}, this.ms);
		}
	}

	stop(): void {
		if (this.intervalID !== 0) {
			clearInterval(this.intervalID);
			this.intervalID = 0;
		}
	}

	isActive(): boolean {
		return this.intervalID !== 0;
	}
}


export function loop<Context>(options: LoopOptions<Context>): Loop<Context> {
	return new Loop(options);
}
