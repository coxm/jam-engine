import {foreverTrue, noop} from 'jam/util/misc';

import {OptionsHandlerItem, Event} from './Manager';


/** A definition for a predicate which checks whether to dispatch a trigger. */
export interface PredicateDef {
	readonly pred: PropertyKey;
}


/** A definition for a triggerable action. */
export interface ActionDef {
	readonly do: PropertyKey;
}


export interface TriggerDefBase<Category> {
	readonly on: Category;
	readonly limit?: number;
}


/**
 * A definition for if/then/else triggers.
 *
 * Defines a trigger which executes the `then` action when the `if` predicate
 * is satisfied, and the `else` action otherwise.
 */
export interface LinearTriggerDef<Category> extends TriggerDefBase<Category> {
	readonly if?: PredicateDef;
	readonly then?: ActionDef;
	readonly else?: ActionDef;
}


export interface SwitchCaseDef {
	/** The value being compared in this case. */
	readonly if: any;
	/** The action to undertake if this case is selected. */
	readonly then: ActionDef;
}


/**
 * A definition for switch triggers.
 *
 * The resulting trigger will search through the list of cases for a value. If
 * the value is found, the corresponding action is executed. Otherwise, if the
 * else action is present, that action is used.
 */
export interface SwitchTriggerDef<Category> extends TriggerDefBase<Category> {
	readonly key: PropertyKey;
	readonly switch: SwitchCaseDef[];
	readonly else?: ActionDef;
}


export type TriggerDef<Category> = (
	LinearTriggerDef<Category> |
	SwitchTriggerDef<Category>
);


export interface Action<EventOb> {
	(event: EventOb): void;
}


export interface Predicate<EventOb> {
	(event: EventOb): boolean;
}


export type PredicateFactory<Event> = (def: PredicateDef) => Predicate<Event>;


export type ActionFactory<Event> = (def: ActionDef) => Action<Event>;


export interface Context<Category, EventData> {
	trigger(ev: Event<Category, EventData>): void;
}


export interface LinearContext<Category, EventData>
	extends Context<Category, EventData>
{
	readonly pred: Predicate<Event<Category, EventData>>;
	readonly yes: Action<Event<Category, EventData>>;
	readonly no: Action<Event<Category, EventData>>;
}


export type SwitchCase<Category, EventData> = [
	Predicate<Event<Category, EventData>>,
	Action<Event<Category, EventData>>
];


export interface SwitchContext<Category, EventData>
	extends Context<Category, EventData>
{
	readonly cases: SwitchCase<Category, EventData>[];
	readonly else: Action<Event<Category, EventData>>;
}


export class Factory<Category, EventData> {
	private actionFactories =
		new Map<PropertyKey, ActionFactory<Event<Category, EventData>>>();

	private conditionFactories =	
		new Map<PropertyKey, PredicateFactory<Event<Category, EventData>>>();

	addActionFactory(
		type: PropertyKey,
		factory: ActionFactory<Event<Category, EventData>>
	)
		: void
	{
		this.actionFactories.set(type, factory)
	}

	addPredicateFactory(
		type: PropertyKey,
		factory: PredicateFactory<Event<Category, EventData>>
	)
		: void
	{
		this.conditionFactories.set(type, factory);
	}

	action(def: ActionDef): Action<Event<Category, EventData>> {
		const factory = this.actionFactories.get(def.do);
		if (!factory) {
			throw new Error(`No '${def.do}' factory`);
		}
		return factory(def);
	}

	predicate(def: PredicateDef) {
		const factory = this.conditionFactories.get(def.pred);
		if (!factory) {
			throw new Error(`No '${def.pred}' factory`);
		}
		return factory(def);
	}

	handler(def: TriggerDef<Category>)
		:	OptionsHandlerItem<Category, EventData>
	{
		return [
			def.on,
			handleEvent,
			{
				limit: def.limit,
				context: this.makeContext(def),
			}
		];
	}

	batch(defs: TriggerDef<Category>[])
		:	OptionsHandlerItem<Category, EventData>[]
	{
		return defs.map(def => this.handler(def));
	}

	makeContext(def: TriggerDef<Category>)
		: Context<Category, EventData>
	{
		return ((<SwitchTriggerDef<Category>> def).switch
			?	this.makeSwitchContext(<SwitchTriggerDef<Category>> def)
			:	this.makeLinearContext(<LinearTriggerDef<Category>> def)
		);
	}

	protected makeLinearContext(def: LinearTriggerDef<Category>)
		:	LinearContext<Category, EventData>
	{
		return {
			trigger: linearTrigger,
			pred: def.if ? this.predicate(def.if) : foreverTrue,
			yes: def.then ? this.action(def.then) : noop,
			no: def.else ? this.action(def.else) : noop,
		};
	}

	protected makeSwitchContext(def: SwitchTriggerDef<Category>)
		:	SwitchContext<Category, EventData>
	{
		const key = def.key;
		return {
			trigger: switchTrigger,
			cases: def.switch.map(
				(c: SwitchCaseDef): SwitchCase<Category, EventData> => [
					checkValue.bind(null, key, c.if),
					this.action(c.then)
				]
			),
			else: def.else ? this.action(def.else) : noop,
		};
	}
}


function handleEvent<Category, EventData>(
	this: Context<Category, EventData>,
	event: Event<Category, EventData>
)
	:	void
{
	this.trigger(event);
}


function linearTrigger<Category, EventData>(
	this: LinearContext<Category, EventData>,
	ev: Event<Category, EventData>
)
	:	void
{
	if (this.pred(ev)) {
		this.yes(ev);
	}
	else {
		this.no(ev);
	}
}


function switchTrigger<Category, EventData>(
	this: SwitchContext<Category, EventData>,
	ev: Event<Category, EventData>
)
	:	void
{
	for (let c of this.cases) {
		if (c[0](ev)) {
			c[1](ev);
			return;
		}
	}
	this.else(ev);
}


function checkValue<Category>(
	key: PropertyKey,
	expected: any,
	event: Event<Category, any>
)
	:	boolean
{
	if (!event.data.hasOwnProperty(key)) {
		throw new Error(typeof key === 'symbol'
			?	'No such key'
			:	`No '${key}' key`
		);
	}
	return event.data[key] === expected;
}
