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

	it("(example 0)", (): void => {
		setKeyDown(KeyCode.ArrowDown, true);
		setKeyDown(KeyCode.ArrowUp, true);
		setKeyDown(KeyCode.ArrowDown, false);
		expect(isDown(KeyCode.ArrowDown)).toBe(false);
		expect(isDown(KeyCode.ArrowUp)).toBe(true);
	});
});
