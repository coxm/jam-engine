export type SchedulerState<StartValue, StopValue> = (
	{running: true; startResult: StartValue;} |
	{running: false; stopResult: StopValue;}
);


export class Scheduler<StartValue, StopValue> {
	constructor(
		private starter: (current: StopValue) => StartValue,
		private stopper: (current: StartValue) => StopValue,
		private prevStartValue: StartValue,
		private prevStopValue: StopValue,
		private running: boolean = false,
	) {
		if (running) {
			starter(prevStopValue);
		}
	}

	start(): void {
		if (!this.running) {
			this.prevStartValue = this.starter(this.prevStopValue);
			this.running = true;
		}
	}

	stop(): void {
		if (this.running) {
			this.prevStopValue = this.stopper(this.prevStartValue);
			this.running = false;
		}
	}

	state(): SchedulerState<StartValue, StopValue> {
		return (this.running
			?	{running: true, startResult: this.prevStartValue}
			:	{running: false, stopResult: this.prevStopValue}
		);
	}

	isRunning(): boolean {
		return this.running;
	}

	value(): StartValue | StopValue {
		return this.running ? this.prevStartValue : this.prevStopValue;
	}
}
