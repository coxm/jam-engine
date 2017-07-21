/**
 * Camera class.
 *
 * Manipulates a PIXI.Container to simulate camera behaviour.
 */
export class Camera {
	private hw: number;
	private hh: number;

	/**
	 * Construct a camera.
	 *
	 * @param rendererWidth the width of the rendering viewport.
	 * @param rendererHeight the height of the rendering viewport.
	 */
	constructor(
		rendererWidth: number,
		rendererHeight: number,
		readonly stage: PIXI.Container = new PIXI.Container()
	) {
		this.width = rendererWidth;
		this.height = rendererHeight;
	}

	/** Get the width of this camera. */
	get width(): number { return this.hw * 2; }
	/** Set the width of this camera. */
	set width(value: number) { this.hw = 0.5 * value; }

	/** Get the height of this camera. */
	get height(): number { return this.hh * 2; }
	/** Set the height of this camera. */
	set height(value: number) { this.hh = 0.5 * value; }

	/** Get the x-coordinate of the left edge of this camera. */
	get xmin(): number {
		return this.stage.position.x - (1 + this.stage.scale.x) * this.hw;
	}
	/** Get the x-coordinate of the right edge of this camera. */
	get xmax(): number {
		return this.stage.position.x + (1 - this.stage.scale.x) * this.hw;
	}
	/** Get the y-coordinate of the bottom edge of this camera. */
	get ymin(): number {
		return this.stage.position.y - (1 + this.stage.scale.y) * this.hh;
	}
	/** Get the y-coordinate of the top edge of this camera. */
	get ymax(): number {
		return this.stage.position.y + (1 - this.stage.scale.y) * this.hh;
	}

	set x(v: number) {
		this.stage.position.x = this.hw - this.stage.scale.x * v;
	}
	set y(v: number) {
		this.stage.position.y = this.hh - this.stage.scale.y * v;
	}

	/** Move the camera to a new position. */
	moveTo(x: number, y: number): void {
		this.stage.position.x = this.hw - this.stage.scale.x * x;
		this.stage.position.y = this.hh - this.stage.scale.y * y;
	}

	/** Pan the camera. */
	moveBy(x: number, y: number): void {
		this.stage.position.x -= x;
		this.stage.position.y -= y;
	}

	/** Set the camera's scale. */
	setScale(x: number, y: number): void {
		this.stage.scale.set(x, y);
	}

	/**
	 * Check if a point or singe coordinate is in range.
	 *
	 * @example
	 * camera.inRange(100, 100);
	 * camera.inRange(100);
	 * camera.inRange(undefined, 100);
	 */
	inRange(x?: number, y?: number): boolean {
		return !(
			x! < this.xmin || this.xmax < x! ||
			y! < this.ymin || this.ymax < y!
		);
	}
}
