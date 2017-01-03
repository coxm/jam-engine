export interface LoopOptions<Context> {
	readonly fn: (this: Context) => void;
	readonly ctx?: Context;
	readonly ms: number;
}


export class Loop {
	readonly fn: () => void;
	readonly ms: number;

	private intervalID: number = 0;

	constructor(options: LoopOptions<any>) {
		this.fn = options.ctx ? options.fn.bind(options.ctx) : options.fn;
		this.ms = options.ms;
	}

	start(): void {
		if (this.intervalID === 0) {
			this.intervalID = setInterval(this.fn, this.ms);
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


export function loop(options: LoopOptions<any>): Loop {
	return new Loop(options);
}
