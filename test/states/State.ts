import {State, StateEventType} from 'jam/states/State';


function neverResolve(): Promise<any> {
	return new Promise((resolve, reject) => {});
}


describe("state event", (): void => {
	let onEvent: jasmine.Spy;
	beforeEach((): void => {
		onEvent = spyOn(State, 'onEvent');
	});

	describe("preloadBegin", (): void => {
		const testName: string = "is fired when a state starts preloading";
		it(testName, (done): void => {
			const state = new State();
			spyOn(state, 'doPreload').and.returnValue(neverResolve());
			state.preload();
			expect(onEvent).toHaveBeenCalledTimes(1);
			expect(onEvent.calls.mostRecent().args).toEqual([
				StateEventType.preloadBegin,
				{state}
			]);
			done();
		});

		const testName2: string = "isn't fired if preloading already happened";
		it(testName2, (done): void => {
			const state = new State();
			state.preload().then((): void => {
				onEvent.calls.reset();
				state.preload();
				expect(onEvent).toHaveBeenCalledTimes(0);
				done();
			});
		});
	});

	describe("preloadEnd", (): void => {
		const testNameA: string = "isn't fired prematurely";
		it(testNameA, (done): void => {
			const state = new State();
			spyOn(state, 'doPreload').and.returnValue(neverResolve());
			state.preload();
			setTimeout((): void => {
				// The preloadBegin event will still be fired, though.
				expect(onEvent).toHaveBeenCalledTimes(1);
				expect(onEvent.calls.mostRecent().args[0]).not.toBe(
					StateEventType.preloadEnd
				);
				done();
			}, 20);
		});

		const testNameB: string = "is fired when a state is done preloading";
		it(testNameB, (done): void => {
			const preloadData = {fake: 'data'};
			const state = new State();
			spyOn(state, 'doPreload').and.returnValue(
				Promise.resolve(preloadData)
			);
			state.preload().then((): void => {
				expect(onEvent).toHaveBeenCalledTimes(2);
				expect(onEvent.calls.mostRecent().args).toEqual([
					StateEventType.preloadEnd,
					{state, data: preloadData}
				]);
				done();
			});
		});
	});

	describe("init", (): void => {
		let state: State;

		beforeEach((): void => {
			state = new State();
		});

		it("isn't fired until the state is preloaded", (done): void => {
			spyOn(state, 'doPreload').and.returnValue(neverResolve());
			state.init();
			setTimeout((): void => {
				expect(onEvent).toHaveBeenCalledTimes(1);
				expect(onEvent.calls.mostRecent().args[0]).toBe(
					StateEventType.preloadBegin
				);
				done();
			});
		});
		it("is fired when the state is initialised", (done) => {
			const initData = {init: 'data'};
			spyOn(state, 'doInit').and.returnValue(initData);

			state.init().then((): void => {
				expect(onEvent).toHaveBeenCalled();
				expect(onEvent.calls.mostRecent().args).toEqual([
					StateEventType.initDone,
					{state, data: initData}
				]);
				done();
			});
		});
		it("is not fired on subsequent re-inits", (done): void => {
			state.preload()
			.then((): Promise<any> => {
				// Make sure to flush previous calls out.
				onEvent.calls.reset();
				return Promise.all([
					state.init(),
					state.init(),
					state.init()
				]);
			})
			.then((): void => {
				expect(onEvent).toHaveBeenCalledTimes(1);
				done();
			});
		});
	});

	describe("pausing", (): void => {
		let state: State = <any> null;

		beforeEach((): void => {
			state = new State();
		});

		it("is fired on state pause", (): void => {
			state.pause();
			expect(onEvent).toHaveBeenCalledTimes(1);
			expect(onEvent.calls.mostRecent().args).toEqual([
				StateEventType.pausing,
				{state}
			]);
		})
		it("isn't fired on double-pause", (): void => {
			state.pause();
			onEvent.calls.reset();
			state.pause();
			expect(onEvent).not.toHaveBeenCalled();
		})
		it("is fired on every pause", (): void => {
			state.pause();
			expect(onEvent).toHaveBeenCalledTimes(1);
			expect(onEvent.calls.mostRecent().args).toEqual([
				StateEventType.pausing,
				{state}
			]);

			state.unpause();
			onEvent.calls.reset();

			state.pause();
			expect(onEvent).toHaveBeenCalledTimes(1);
			expect(onEvent.calls.mostRecent().args).toEqual([
				StateEventType.pausing,
				{state}
			]);
		})
	})

	describe("unpausing", (): void => {
		let state: State = <any> null;

		beforeEach((): void => {
			state = new State();
		});

		it("is fired on state unpause", (): void => {
			state.pause();
			onEvent.calls.reset();

			state.unpause();
			expect(onEvent).toHaveBeenCalledTimes(1);
			expect(onEvent.calls.mostRecent().args).toEqual([
				StateEventType.unpausing,
				{state}
			]);
		});
		it("isn't fired on double-unpause", (): void => {
			state.unpause();
			expect(onEvent).not.toHaveBeenCalled();

			state.pause();

			onEvent.calls.reset();

			state.unpause();
			state.unpause();
			expect(onEvent).toHaveBeenCalledTimes(1);
			expect(onEvent.calls.mostRecent().args).toEqual([
				StateEventType.unpausing,
				{state}
			]);
		});
	})

	describe("stopping", (): void => {
		let state: State;

		beforeEach((): void => {
			state = new State();
		});

		it("isn't fired if the state wasn't running", (done): void => {
			state.stop();
			setTimeout((): void => {
				expect(onEvent).not.toHaveBeenCalled();
				done();
			});
		});
		it("is fired on state stop", (done): void => {
			state.start().then((): void => {
				state.stop();
				expect(onEvent.calls.mostRecent().args).toEqual([
					StateEventType.stopping,
					{state}
				]);
				done();
			});
		});
	});
});


describe("State#preload", (): void => {
	let state: State;

	beforeEach((): void => {
		state = new State();
	});

	it("loads the data if unloaded", (done): void => {
		const preloadData = {preload: 'data'};
		const spy = spyOn(state, 'doPreload').and.returnValue(preloadData);
		state.preload().then((data: any): void => {
			expect(spy).toHaveBeenCalledTimes(1);
			expect(data).toBe(preloadData);
			done();
		});
	});
	it("doesn't re-load data if already loaded", (done): void => {
		const spy = spyOn(state, 'doPreload').and.callThrough();
		Promise.all([
			state.preload(),
			state.preload()
		]).then((): void => {
			expect(spy).toHaveBeenCalledTimes(1);
			done();
		});
	});
});


describe("State#init", (): void => {
	let state: State;
	let doInit: jasmine.Spy;

	beforeEach((): void => {
		state = new State();
		doInit = spyOn(state, 'doInit');
	});

	it("doesn't call doInit before preload completes", (done): void => {
		spyOn(state, 'doPreload').and.returnValue(neverResolve());
		state.init();
		setTimeout((): void => {
			expect(doInit).not.toHaveBeenCalled();
			done();
		}, 100);
	});
	it("init once the preload is complete", (done): void => {
		state.init().then((): void => {
			expect(doInit).toHaveBeenCalled();
			done();
		});
	});
	it("sets the isInitialised flag", (done): void => {
		state.init().then((): void => {
			expect(state.isInitialised).toBe(true);
			done();
		});
	});
});


describe("State#start", (): void => {
	let state: State;
	let doStart: jasmine.Spy;

	beforeEach((): void => {
		state = new State();
		doStart = spyOn(state, 'doStart');
	});

	it(
		"doesn't call doStart before initialisation is complete",
		(done): void => {
			spyOn(state, 'init').and.returnValue(neverResolve());
			state.start();
			setTimeout((): void => {
				expect(doStart).not.toHaveBeenCalled();
				done();
			});
		}
	);
	it("starts once the initialisation is complete", (done): void => {
		state.start().then((): void => {
			expect(doStart).toHaveBeenCalled();
			done();
		});
	});
	it("sets the isRunning flag", (done): void => {
		state.start().then((): void => {
			expect(state.isRunning).toBe(true);
			done();
		});
	});
	it(
		"doesn't double-start if called twice before initialised",
		(done): void => {
			state.start();
			state.start().then((): void => {
				expect(doStart).toHaveBeenCalledTimes(1);
				done();
			});
		}
	);
	it("doesn't double-start if called while running", (done) => {
		state.start()
		.then((): Promise<void> => state.start())
		.then((): void => {
			expect(doStart).toHaveBeenCalledTimes(1);
			done();
		});
	});
});


describe("State#restart", () => {
	let state: State;

	beforeEach((): void => {
		state = new State();
	});

	it("starts the state if not running", (done) => {
		state.restart().then((): void => {
			expect(state.isRunning).toBe(true);
			done();
		});
	});
	it("doesn't start the state if running", (done) => {
		state.start().then((): void => {
			const doStart = spyOn(state, 'doStart');
			state.restart().then((): void => {
				expect(doStart).not.toHaveBeenCalled();
				done();
			});
		});
	});
	it("doesn't unpause the state", (done) => {
		state.pause();
		state.restart().then((): void => {
			expect(state.isPaused).toBe(true);
			done();
		});
	});
});
