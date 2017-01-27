import {setKeyDown, isDown} from 'jam/input/keyboard';
import {KeyCode} from 'jam/input/KeyCode';


const KEYS_MAX: number = 256;


describe("isDown", (): void => {
	it("marks all keys as up by default", (): void => {
		let error: string = '';
		for (let i: number = 0; i < KEYS_MAX; ++i) {
			if (isDown(i)) {
				error = `Exected isDown(${i}) to be false`;
				break;
			}
		}

		expect(error).toBeFalsy(error);
	});

	it("indicates exactly the pressed key as down", (): void => {
		setKeyDown(KeyCode.Enter, true);
		let error: string = '';
		for (let i: number = 0; i < KEYS_MAX; ++i) {
			const expectation: boolean = (i === KeyCode.Enter);
			if (isDown(i) !== expectation) {
				error = `Expected isDown(${i}) to be ${expectation}`;
				break;
			}
			expect(error).toBeFalsy(error);
		}
	});

	it("indicates exactly the pressed keys as down", (): void => {
		const keysDown: KeyCode[] = [
			KeyCode.Enter,
			KeyCode.ArrowUp,
			KeyCode.Pause,
			KeyCode.ArrowLeft
		];
		let error: string = '';
		for (let i: number = 0; i < KEYS_MAX; ++i) {
			const expectation: boolean = keysDown.indexOf(i) >= 0;
			if (isDown(i) !== expectation) {
				error = `Expected isDown(${i} to be ${expectation}`;
				break;
			}
			expect(error).toBeFalsy(error);
		}
	});

	it("indicates a key is up when it has been unset", (): void => {
		setKeyDown(KeyCode.ArrowUp, true);
		setKeyDown(KeyCode.ArrowUp, false);
		let error: string = '';
		for (let i: number = 0; i < KEYS_MAX; ++i) {
			if (isDown(i)) {
				error = `Expected isDown(${i}) to be false`;
				break;
			}
			expect(error).toBeFalsy(error);
		}
	});

	it("(complicated example)", (): void => {
		const keys: any = {};
		setKeyDown(KeyCode.ArrowDown, keys.ArrowDown = true);
		setKeyDown(KeyCode.ArrowRight, keys.ArrowRight = true);
		setKeyDown(KeyCode.Escape, keys.Escape = true);

		let count: number = 0;
		function check(): void {
			++count;
			let error: string = '';
			for (let i: number = 0; i < KEYS_MAX; ++i) {
				if (isDown(i) !== !!keys[i]) {
					error =
						`Expected isDown(${i}) to be ${keys[i]} (${count})`;
					break;
				}
			}
			expect(error).toBeFalsy(error);
		}

		check();

		setKeyDown(KeyCode.ArrowDown, keys.ArrowDown = false);
		setKeyDown(KeyCode.ArrowUp, keys.ArrowUp = false);
		setKeyDown(KeyCode.Pause, keys.Pause = true);
		check();

		setKeyDown(KeyCode.ArrowLeft, keys.ArrowLeft = true);
		setKeyDown(KeyCode.AltGraph, keys.AltGraph = true);
		setKeyDown(KeyCode.ArrowLeft, keys.ArrowLeft = false);
		check();
	});
});
