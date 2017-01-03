export interface RenderLoop {
	start(): void;
	stop(): void;
	isRunning(): boolean;
}


/**
 * Create a render loop.
 *
 * For example, to render a PIXI stage, call
 * `loop(renderer.render.bind(renderer), stage);`.
 */
export function loop(fn: () => void): RenderLoop {
	let frameID: number = 0;
	function render(): void {
		fn();
		frameID = requestAnimationFrame(render);
	}
	return {
		start(): void {
			render();
		},
		stop(): void {
			cancelAnimationFrame(frameID);
			frameID = 0;
		},
		isRunning(): boolean {
			return frameID !== 0;
		}
	};
}
