export interface ComponentDef {
	type: string;
}


export interface Component {
	readonly type: string;
	onAdd(actor: Actor): void;
	onRemove(actor: Actor): void;
}


export interface ActorDef {
	alias?: string;
	cmp: ComponentDef[];
	position: [number, number];
}


export class Actor {
	readonly alias: string|undefined;
	cmp: { [id: string]: Component; } = {};
	initialised: { [id: string]: boolean; } = {};

	constructor(
		def: ActorDef,
		cmp: { [id: string]: Component; },
		init: boolean
	) {
		this.alias = def.alias;
		this.cmp = cmp || {};
		if (init !== false) {
			this.init();
		}
	}

	setCmp(cmp: Component, init: boolean): void {
		this.cmp[cmp.type] = cmp;
		if (init !== false) {
			cmp.onAdd(this);
		}
	}

	removeCmp(type: string): void {
		if (this.initialised[type]) {
			this.cmp[type].onRemove(this);
		}
		delete this.cmp[type];
		delete this.initialised[type];
	}

	init(): void {
		for (let key in this.cmp) {
			if (!this.initialised[key]) {
				this.cmp[key].onAdd(this);
				this.initialised[key] = true;
			}
		}
	}

	deinit(): void {
		for (let key in this.cmp) {
			if (this.initialised[key]) {
				this.cmp[key].onRemove(this);
				this.initialised[key] = false;
			}
		}
	}

	destroy(): void {
		this.deinit();
		this.cmp = {};
		this.initialised = {};
	}
}
