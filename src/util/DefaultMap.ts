export class DefaultMap<Key, Value>
	extends Map<Key, Value>
{
	private construct: (key: Key) => Value;

	constructor(construct: (key: Key) => Value) {
		super();
		this.construct = construct;
	}

	load(key: Key): Value {
		let value: Value|undefined = this.get(key);
		if (value === undefined) {
			value = this.construct(key);
			this.set(key, <Value> value);
		}
		return <Value> value;
	}
}
