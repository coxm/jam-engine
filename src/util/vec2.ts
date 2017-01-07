export function dist(a: AnyVec2, b: AnyVec2): number {
	const dx: number = b[0] - a[0];
	const dy: number = b[1] - a[1];
	return Math.sqrt(dx * dx + dy * dy);
}


export function angleOfLine(a: AnyVec2, b: AnyVec2): number {
	return Math.atan2(b[1] - a[1], b[0] - a[0]);
}
