import {State} from 'jam/states/State';


function neverResolve(): Promise<any> {
	return new Promise((resolve, reject) => {});
}


describe("state callback", (): void => {
	describe("onAnyPreloadBegin", (): void => {
		it("gets called when a state starts preloading", (done): void => {
			const state = new State({
				name: "gets called when a state starts preloading",
			});
			spyOn(state, 'doPreload').and.returnValue(neverResolve());
			const spy = spyOn(State, 'onAnyPreloadBegin');
			state.preload();
			expect(spy).toHaveBeenCalledTimes(1);
			expect(spy).toHaveBeenCalledWith(state);
			done();
		});
	});

	describe("onAnyPreloadEnd", (): void => {
		it("doesn't get called prematurely", (done): void => {
			const state = new State({
				name: "doesn't get called prematurely",
			});
			spyOn(state, 'doPreload').and.returnValue(neverResolve());
			const spy = spyOn(State, 'onAnyPreloadEnd');
			state.preload();
			setTimeout((): void => {
				expect(spy).not.toHaveBeenCalled();
				done();
			}, 20);
		});
		it("gets called when a state is done preloading", (done): void => {
			const preloadData = {fake: 'data'};
			const spy = spyOn(State, 'onAnyPreloadEnd');
			const state = new State({
				name: "gets called when a state is done preloading",
			});
			spyOn(state, 'doPreload').and.returnValue(
				Promise.resolve(preloadData)
			);
			state.preload().then((): void => {
				expect(spy).toHaveBeenCalledTimes(1);
				expect(spy).toHaveBeenCalledWith(state, preloadData);
				done();
			});
		});
	});

	describe("onAnyStart", (): void => {
		let state: State;
		let spy: jasmine.Spy;

		beforeEach((): void => {
			state = new State({name: 'TestState'});
			spy = spyOn(State, 'onAnyStart');
		});

		it("doesn't get called until the state is preloaded", (done): void => {
			spyOn(state, 'doPreload').and.returnValue(neverResolve());
			state.start();
			setTimeout((): void => {
				expect(spy).not.toHaveBeenCalled();
				done();
			});
		});
		it("gets called when the state is started", (done) => {
			const preloadData = {preload: 'data'};
			spyOn(state, 'doPreload').and.returnValue(preloadData);

			state.start().then((): void => {
				expect(spy).toHaveBeenCalledTimes(1);
				expect(spy).toHaveBeenCalledWith(state, preloadData);
				done();
			});
		});
		it("gets called on subsequent re-starts", (done): void => {
			Promise.all([
				state.start(),
				state.start(),
				state.start()
			]).then((): void => {
				expect(spy).toHaveBeenCalledTimes(3);
				done();
			});
		});
	});

	describe("onAnyPause", (): void => {
		let state: State = <any> null;

		beforeEach((): void => {
			state = new State({name: 'onAnyPause test'});
		});

		it("gets called on state pause", (): void => {
			const spy = spyOn(State, 'onAnyPause');
			state.pause();
			expect(spy).toHaveBeenCalledTimes(1);
			expect(spy).toHaveBeenCalledWith(state);
		})
		it("doesn't get called on double-pause", (): void => {
			state.pause();
			const spy = spyOn(State, 'onAnyPause');
			state.pause();
			expect(spy).not.toHaveBeenCalled();
		})
		it("gets called on every pause", (): void => {
			const spy = spyOn(State, 'onAnyPause');
			state.pause();
			expect(spy).toHaveBeenCalledTimes(1);

			state.unpause();
			state.pause();
			expect(spy).toHaveBeenCalledTimes(2);
		})
	})

	describe("onAnyUnpause", (): void => {
		let state: State = <any> null;

		beforeEach((): void => {
			state = new State({name: 'onAnyUnpause test'});
		});

		it("gets called on state unpause", (): void => {
			const spy = spyOn(State, 'onAnyUnpause');
			state.pause();
			expect(spy).not.toHaveBeenCalled();

			state.unpause();
			expect(spy).toHaveBeenCalledTimes(1);
			expect(spy).toHaveBeenCalledWith(state);
		});
		it("doesn't get called on double-unpause", (): void => {
			const spy = spyOn(State, 'onAnyUnpause');
			state.unpause();
			expect(spy).not.toHaveBeenCalled();

			state.pause();
			state.unpause();
			state.unpause();
			expect(spy).toHaveBeenCalledTimes(1);
		});
	})

	describe("onAnyEnd", (): void => {
		let state: State = <any> null;
		let spy: jasmine.Spy = <any> null;

		beforeEach((): void => {
			state = new State({name: 'onAnyEnd test'});
			spy = spyOn(State, 'onAnyEnd');
		});

		it("doesn't get called if the state wasn't running", (done): void => {
			state.end();
			setTimeout((): void => {
				expect(spy).not.toHaveBeenCalled();
				done();
			});
		});
		it("gets called on state end", (done): void => {
			state.start().then((): void => {
				state.end();
				expect(spy).toHaveBeenCalledTimes(1);
				expect(spy).toHaveBeenCalledWith(state);
				done();
			});
		});
	});
});


describe("State#preload", (): void => {
	let state: State;

	beforeEach((): void => {
		state = new State({name: 'State#preload test'});
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


describe("State#start", (): void => {
	let state: State;

	beforeEach((): void => {
		state = new State({name: 'State#start test'});
	});

	it("doesn't call onStart before preload completes", (done): void => {
		spyOn(state, 'doPreload').and.returnValue(neverResolve());
		const onStart = spyOn(state, 'onStart');
		state.start();
		setTimeout((): void => {
			expect(onStart).not.toHaveBeenCalled();
			done();
		}, 100);
	});
	it("starts once the preload is complete", (done): void => {
		const onStart = spyOn(state, 'onStart');
		state.start().then((): void => {
			expect(onStart).toHaveBeenCalled();
			done();
		});
	});
	it("sets the isRunning flag", (done): void => {
		state.start().then((): void => {
			expect(state.isRunning).toBe(true);
			done();
		});
	});
});


describe("State#end", (): void => {
	it("doesn't call onEnd if not already running", (): void => {
		const state = new State({name: 'State#end test'});
		const onEnd = spyOn(state, 'onEnd');
		state.end();
		expect(onEnd).not.toHaveBeenCalled();
	});
	it("calls onEnd if already running", (done): void => {
		const state = new State({name: 'State#end test'});
		const onEnd = spyOn(state, 'onEnd');
		state.start().then((): void => {
			state.end();
			expect(onEnd).toHaveBeenCalled();
			done();
		});
	});
	it("unsets the isRunning flag", (done): void => {
		const state = new State({name: 'State#end test'});
		state.start().then((): void => {
			state.end();
			expect(state.isRunning).toBe(false);
			done();
		});
	});
});
