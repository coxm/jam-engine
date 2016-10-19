export class Scheduler {
	constructor(
		private starter: (current: T) => T,
		private stopper: (current: T) => T,
		private current: T = <T> null,
		private running: boolean = false
	) {
		if (running) {
			starter(current);
		}
	}

	start(): void {
		if (!this.running) {
			this.current = this.starter(this.current);
			this.running = true;
		}
	}

	stop(): void {
		if (this.running) {
			this.current = this.stopper(this.current);
			this.running = false;
		}
	}

	isRunning(): boolean {
		return this.running;
	}

	value(): T {
		return this.current;
	}
}
