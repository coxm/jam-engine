type Vec2 = [number, number] & number[];


type AnyVec2 = (
	[number, number] |
	number[] |
	Float32Array
);


interface Dict<V> {
	[key: number]: V;
	[key: string]: V;
}


type DictKey = string | number | symbol;
