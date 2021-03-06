type Vec2 = [number, number] & number[];


type AnyVec2 = (
	[number, number] |
	number[] |
	Float32Array
);


type AllVec2 = [number, number] & number[] & Float32Array;
